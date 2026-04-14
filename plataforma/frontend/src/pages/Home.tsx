/**
 * Home/Landing page
 */

import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../components/common/Button';
import { Card, CardBody } from '../components/common/Card';
import { useAuth } from '../hooks/useAuth';
import { ROUTES } from '../utils/constants';

export const Home: React.FC = () => {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="bg-itac-navy text-white py-24">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center">
            <h1 className="text-5xl md:text-6xl font-heading font-bold mb-6 text-itac-text-light">
              Aprende Ciberseguridad y Desarrollo
            </h1>
            <p className="text-xl mb-8 text-white/50">
              Accede a cursos profesionales diseñados por expertos. Aprende a tu
              ritmo y obtén certificaciones reconocidas.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              {isAuthenticated ? (
                <>
                  <Button
                    size="lg"
                    variant="secondary"
                    onClick={() => navigate(ROUTES.DASHBOARD)}
                  >
                    Ir a Mi Dashboard
                  </Button>
                  <Button
                    size="lg"
                    variant="outline"
                    onClick={() => navigate(ROUTES.COURSES)}
                  >
                    Explorar Cursos
                  </Button>
                </>
              ) : (
                <>
                  <Button
                    size="lg"
                    variant="secondary"
                    onClick={() => navigate(ROUTES.REGISTER)}
                  >
                    Comenzar Gratis
                  </Button>
                  <Button
                    size="lg"
                    variant="outline"
                    onClick={() => navigate(ROUTES.COURSES)}
                  >
                    Ver Cursos
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 bg-white dark:bg-itac-navy-dark">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-heading font-bold text-center mb-12 text-gray-900 dark:text-itac-text-light">
            ¿Por qué elegirnos?
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <Card>
              <CardBody>
                <div className="text-center">
                  <div className="inline-flex items-center justify-center w-16 h-16 bg-itac-card-blue rounded-xl mb-4">
                    <svg
                      className="w-8 h-8 text-itac-blue"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
                      />
                    </svg>
                  </div>
                  <h3 className="text-xl font-semibold mb-2">
                    Contenido de Calidad
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400">
                    Cursos desarrollados por profesionales con años de experiencia
                    en la industria.
                  </p>
                </div>
              </CardBody>
            </Card>

            <Card>
              <CardBody>
                <div className="text-center">
                  <div className="inline-flex items-center justify-center w-16 h-16 bg-itac-card-orange rounded-xl mb-4">
                    <svg
                      className="w-8 h-8 text-itac-orange"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                  </div>
                  <h3 className="text-xl font-semibold mb-2">
                    Certificaciones
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400">
                    Obtén certificados reconocidos al completar tus cursos y destaca
                    en el mercado laboral.
                  </p>
                </div>
              </CardBody>
            </Card>

            <Card>
              <CardBody>
                <div className="text-center">
                  <div className="inline-flex items-center justify-center w-16 h-16 bg-itac-card-blue rounded-xl mb-4">
                    <svg
                      className="w-8 h-8 text-itac-blue-mid"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                  </div>
                  <h3 className="text-xl font-semibold mb-2">
                    Aprende a tu Ritmo
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400">
                    Acceso 24/7 al contenido. Estudia cuando y donde quieras, sin
                    presiones.
                  </p>
                </div>
              </CardBody>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-itac-navy-dark text-white">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-heading font-bold mb-4 text-itac-text-light">
            Listo para comenzar tu aprendizaje?
          </h2>
          <p className="text-xl mb-8 text-white/50">
            Únete a miles de estudiantes que ya están mejorando sus habilidades.
          </p>
          {!isAuthenticated && (
            <Button
              size="lg"
              variant="secondary"
              onClick={() => navigate(ROUTES.REGISTER)}
            >
              Registrarse Ahora
            </Button>
          )}
        </div>
      </section>
    </div>
  );
};
