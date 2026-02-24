import Docker from 'dockerode';
import { Readable } from 'stream';
import { config, LANGUAGE_CONFIGS } from '../config';
import { ExecuteRequest, ExecutionResult, Language } from '../types';
import { logger } from '../utils/logger';
import { validator } from './validator';

/**
 * Docker Executor Service
 * Handles secure code execution in isolated Docker containers
 */
export class DockerExecutor {
  private docker: Docker;

  constructor() {
    this.docker = new Docker({
      socketPath: config.DOCKER_SOCKET_PATH,
    });
    logger.info('Docker executor initialized');
  }

  /**
   * Main execution method
   */
  async executeCode(params: ExecuteRequest): Promise<ExecutionResult> {
    const startTime = Date.now();
    const timeout = params.timeout || config.SANDBOX_TIMEOUT;

    logger.info('Starting code execution', {
      language: params.language,
      timeout,
      hasTests: !!params.tests,
    });

    let container: Docker.Container | null = null;

    try {
      // 1. Create container with security limits
      container = await this.createContainer(params.language);
      logger.debug('Container created', { id: container.id });

      // 2. Copy code to container
      await this.copyCodeToContainer(container, params.code, params.language);
      logger.debug('Code copied to container');

      // 3. Start container
      await container.start();
      logger.debug('Container started');

      // 4. Execute with timeout
      const output = await this.runWithTimeout(container, params.language, timeout);
      logger.debug('Execution completed', {
        exitCode: output.exitCode,
        stdoutLength: output.stdout.length,
        stderrLength: output.stderr.length,
      });

      const executionTime = Date.now() - startTime;

      // 5. Validate against tests if provided
      let passed = output.exitCode === 0;
      let testsResults;

      if (params.tests && params.tests.length > 0) {
        testsResults = validator.validate(output.stdout, params.tests);
        passed = passed && testsResults.every(r => r.passed);
        logger.debug('Tests validation completed', {
          totalTests: testsResults.length,
          passedTests: testsResults.filter(r => r.passed).length,
        });
      }

      const result: ExecutionResult = {
        stdout: output.stdout,
        stderr: output.stderr,
        exitCode: output.exitCode,
        executionTime,
        passed,
        testsResults,
      };

      logger.info('Code execution successful', {
        executionTime,
        passed,
        exitCode: output.exitCode,
      });

      return result;

    } catch (error) {
      const executionTime = Date.now() - startTime;
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';

      logger.error('Code execution failed', {
        error: errorMessage,
        executionTime,
        language: params.language,
      });

      return {
        stdout: '',
        stderr: errorMessage,
        exitCode: -1,
        executionTime,
        passed: false,
        error: errorMessage,
      };

    } finally {
      // 6. Cleanup - ALWAYS executed
      if (container) {
        await this.cleanup(container);
        logger.debug('Container cleanup completed');
      }
    }
  }

  /**
   * Creates a Docker container with security restrictions
   */
  private async createContainer(language: Language): Promise<Docker.Container> {
    const langConfig = LANGUAGE_CONFIGS[language];

    const containerConfig: Docker.ContainerCreateOptions = {
      Image: config.SANDBOX_IMAGE,
      AttachStdin: false,
      AttachStdout: true,
      AttachStderr: true,
      Tty: false,
      OpenStdin: false,
      StdinOnce: false,

      // Security settings
      User: 'sandbox',
      NetworkDisabled: config.SANDBOX_NETWORK_DISABLED,

      HostConfig: {
        // Resource limits
        Memory: this.parseMemoryLimit(config.SANDBOX_MEMORY_LIMIT),
        MemorySwap: this.parseMemoryLimit(config.SANDBOX_MEMORY_LIMIT), // Same as memory to disable swap
        NanoCpus: parseInt(config.SANDBOX_CPU_LIMIT) * 1e9,

        // Security
        Privileged: false,
        ReadonlyRootfs: false, // Need to write code file
        CapDrop: ['ALL'],
        SecurityOpt: ['no-new-privileges'],

        // No volume mounts
        Binds: [],

        // Prevent network access
        NetworkMode: config.SANDBOX_NETWORK_DISABLED ? 'none' : 'bridge',
      },
    };

    try {
      const container = await this.docker.createContainer(containerConfig);
      logger.debug('Container created successfully', {
        containerId: container.id,
        language,
      });
      return container;
    } catch (error) {
      logger.error('Failed to create container', {
        error: error instanceof Error ? error.message : 'Unknown error',
        language,
      });
      throw new Error(`Failed to create container: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Copies code to the container
   */
  private async copyCodeToContainer(
    container: Docker.Container,
    code: string,
    language: Language
  ): Promise<void> {
    const langConfig = LANGUAGE_CONFIGS[language];
    const fileName = langConfig.fileName;

    try {
      // Create a tar archive with the code file
      const tar = require('tar-stream');
      const pack = tar.pack();

      // Add the code file to the archive
      pack.entry({ name: fileName }, code, (err) => {
        if (err) {
          logger.error('Failed to create tar entry', { error: err.message });
        }
      });

      pack.finalize();

      // Upload to container
      await container.putArchive(pack, { path: '/sandbox' });
      logger.debug('Code copied to container', { fileName });
    } catch (error) {
      logger.error('Failed to copy code to container', {
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw new Error('Failed to copy code to container');
    }
  }

  /**
   * Executes code in container with timeout
   */
  private async runWithTimeout(
    container: Docker.Container,
    language: Language,
    timeout: number
  ): Promise<{ stdout: string; stderr: string; exitCode: number }> {
    const langConfig = LANGUAGE_CONFIGS[language];
    const command = [...langConfig.command, langConfig.fileName];

    return new Promise(async (resolve, reject) => {
      const timeoutId = setTimeout(async () => {
        logger.warn('Execution timeout reached', { timeout });
        try {
          await container.kill();
        } catch (err) {
          logger.error('Failed to kill timed out container', {
            error: err instanceof Error ? err.message : 'Unknown error',
          });
        }
        reject(new Error(`Execution timeout after ${timeout}ms`));
      }, timeout);

      try {
        // Create exec instance
        const exec = await container.exec({
          Cmd: command,
          AttachStdout: true,
          AttachStderr: true,
          WorkingDir: '/sandbox',
        });

        // Start exec and get stream
        const stream = await exec.start({ Detach: false, Tty: false });

        let stdout = '';
        let stderr = '';

        // Demultiplex Docker stream
        container.modem.demuxStream(
          stream,
          {
            write: (chunk: Buffer) => { stdout += chunk.toString(); },
          } as NodeJS.WritableStream,
          {
            write: (chunk: Buffer) => { stderr += chunk.toString(); },
          } as NodeJS.WritableStream
        );

        stream.on('end', async () => {
          clearTimeout(timeoutId);

          try {
            const inspectResult = await exec.inspect();
            resolve({
              stdout: stdout.trim(),
              stderr: stderr.trim(),
              exitCode: inspectResult.ExitCode || 0,
            });
          } catch (err) {
            logger.error('Failed to inspect exec result', {
              error: err instanceof Error ? err.message : 'Unknown error',
            });
            reject(err);
          }
        });

        stream.on('error', (err) => {
          clearTimeout(timeoutId);
          logger.error('Stream error', { error: err.message });
          reject(err);
        });

      } catch (error) {
        clearTimeout(timeoutId);
        logger.error('Execution failed', {
          error: error instanceof Error ? error.message : 'Unknown error',
        });
        reject(error);
      }
    });
  }

  /**
   * Cleans up container resources
   */
  private async cleanup(container: Docker.Container): Promise<void> {
    try {
      // Stop container if running
      try {
        await container.stop({ t: 1 });
        logger.debug('Container stopped');
      } catch (err) {
        // Container might already be stopped
        logger.debug('Container already stopped or error stopping', {
          error: err instanceof Error ? err.message : 'Unknown error',
        });
      }

      // Remove container
      try {
        await container.remove({ force: true, v: true });
        logger.debug('Container removed');
      } catch (err) {
        logger.error('Failed to remove container', {
          error: err instanceof Error ? err.message : 'Unknown error',
        });
      }
    } catch (error) {
      logger.error('Cleanup failed', {
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      // Don't throw - cleanup should be best effort
    }
  }

  /**
   * Parses memory limit string to bytes
   */
  private parseMemoryLimit(limit: string): number {
    const units: { [key: string]: number } = {
      b: 1,
      k: 1024,
      m: 1024 * 1024,
      g: 1024 * 1024 * 1024,
    };

    const match = limit.toLowerCase().match(/^(\d+)([bkmg]?)$/);
    if (!match) {
      throw new Error(`Invalid memory limit format: ${limit}`);
    }

    const value = parseInt(match[1]);
    const unit = match[2] || 'b';

    return value * units[unit];
  }

  /**
   * Health check - verifies Docker is accessible
   */
  async healthCheck(): Promise<boolean> {
    try {
      await this.docker.ping();
      return true;
    } catch (error) {
      logger.error('Docker health check failed', {
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      return false;
    }
  }
}

// Export singleton instance
export const dockerExecutor = new DockerExecutor();
