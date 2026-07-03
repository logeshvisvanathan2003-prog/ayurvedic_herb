import { MemberProvider } from '@/integrations';
import { createBrowserRouter, RouterProvider, Navigate, Outlet } from 'react-router-dom';
import { ScrollToTop } from '@/lib/scroll-to-top';
import ErrorPage from '@/integrations/errorHandlers/ErrorPage';
import HomePage from '@/components/pages/HomePage';
import FarmerPortalPage from '@/components/pages/FarmerPortalPage';
import ProcessingUnitPage from '@/components/pages/ProcessingUnitPage';
import LaboratoryTestingPage from '@/components/pages/LaboratoryTestingPage';
import ConsumerPortalPage from '@/components/pages/ConsumerPortalPage';
import ContactPage from '@/components/pages/ContactPage';
import FarmerLoginPage from '@/components/pages/FarmerLoginPage';
import FarmerRegisterPage from '@/components/pages/FarmerRegisterPage';
import LaboratoryLoginPage from '@/components/pages/LaboratoryLoginPage';
import LaboratoryRegisterPage from '@/components/pages/LaboratoryRegisterPage';
import ConsumerLoginPage from '@/components/pages/ConsumerLoginPage';
import ConsumerRegisterPage from '@/components/pages/ConsumerRegisterPage';
import AdminLoginPage from '@/components/pages/AdminLoginPage';
import AdminRegisterPage from '@/components/pages/AdminRegisterPage';
import FarmerDetailPage from '@/components/pages/FarmerDetailPage';
import ProcessingDetailPage from '@/components/pages/ProcessingDetailPage';
import LaboratoryDetailPage from '@/components/pages/LaboratoryDetailPage';
import ConsumerDetailPage from '@/components/pages/ConsumerDetailPage';
import LogisticsPortalPage from '@/components/pages/LogisticsPortalPage';

// Layout component that includes ScrollToTop
function Layout() {
  return (
    <>
      <ScrollToTop />
      <Outlet />
    </>
  );
}

const router = createBrowserRouter([
  {
    path: "/",
    element: <Layout />,
    errorElement: <ErrorPage />,
    children: [
      {
        index: true,
        element: <HomePage />,
        routeMetadata: {
          pageIdentifier: 'home',
        },
      },
      {
        path: "farmer-portal",
        element: <FarmerPortalPage />,
        routeMetadata: {
          pageIdentifier: 'farmer-portal',
        },
      },
      {
        path: "processing-unit",
        element: <ProcessingUnitPage />,
        routeMetadata: {
          pageIdentifier: 'processing-unit',
        },
      },
      {
        path: "laboratory-testing",
        element: <LaboratoryTestingPage />,
        routeMetadata: {
          pageIdentifier: 'laboratory-testing',
        },
      },
      {
        path: "consumer-portal",
        element: <ConsumerPortalPage />,
        routeMetadata: {
          pageIdentifier: 'consumer-portal',
        },
      },
      {
        path: "contact",
        element: <ContactPage />,
        routeMetadata: {
          pageIdentifier: 'contact',
        },
      },
      {
        path: "farmer-login",
        element: <FarmerLoginPage />,
        routeMetadata: {
          pageIdentifier: 'farmer-login',
        },
      },
      {
        path: "farmer-register",
        element: <FarmerRegisterPage />,
        routeMetadata: {
          pageIdentifier: 'farmer-register',
        },
      },
      {
        path: "laboratory-login",
        element: <LaboratoryLoginPage />,
        routeMetadata: {
          pageIdentifier: 'laboratory-login',
        },
      },
      {
        path: "laboratory-register",
        element: <LaboratoryRegisterPage />,
        routeMetadata: {
          pageIdentifier: 'laboratory-register',
        },
      },
      {
        path: "consumer-login",
        element: <ConsumerLoginPage />,
        routeMetadata: {
          pageIdentifier: 'consumer-login',
        },
      },
      {
        path: "consumer-register",
        element: <ConsumerRegisterPage />,
        routeMetadata: {
          pageIdentifier: 'consumer-register',
        },
      },
      {
        path: "admin-login",
        element: <AdminLoginPage />,
        routeMetadata: {
          pageIdentifier: 'admin-login',
        },
      },
      {
        path: "admin-register",
        element: <AdminRegisterPage />,
        routeMetadata: {
          pageIdentifier: 'admin-register',
        },
      },
      {
        path: "farmer-detail/:id",
        element: <FarmerDetailPage />,
        routeMetadata: {
          pageIdentifier: 'farmer-detail',
        },
      },
      {
        path: "processing-detail/:id",
        element: <ProcessingDetailPage />,
        routeMetadata: {
          pageIdentifier: 'processing-detail',
        },
      },
      {
        path: "laboratory-detail/:id",
        element: <LaboratoryDetailPage />,
        routeMetadata: {
          pageIdentifier: 'laboratory-detail',
        },
      },
      {
        path: "consumer-detail/:id",
        element: <ConsumerDetailPage />,
        routeMetadata: {
          pageIdentifier: 'consumer-detail',
        },
      },
      {
        path: "logistics",
        element: <LogisticsPortalPage />,
        routeMetadata: {
          pageIdentifier: 'logistics',
        },
      },
      {
        path: "*",
        element: <Navigate to="/" replace />,
      },
    ],
  },
], {
  basename: import.meta.env.BASE_NAME,
});

export default function AppRouter() {
  return (
    <MemberProvider>
      <RouterProvider router={router} />
    </MemberProvider>
  );
}
