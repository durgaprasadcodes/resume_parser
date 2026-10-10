import './App.css'
import { createBrowserRouter, RouterProvider } from 'react-router-dom'
import Home from './pages/Home'
import Analysis from './pages/Analysis'
import Profile from './pages/Profile'
import Login from './auth/Auth'
import NotFound from './pages/NotFound'
import Loading from './anim/Loading'
import OTPVerification from './auth/OTPVerification.jsx'
import ForgotPassword from './auth/ForgotPassword.jsx'
import { AuthProvider } from './auth/AuthContext.jsx'
import { ProtectedRoute, PublicOnlyRoute } from './pages/ProtectedRoute'

function App() {
  const router = createBrowserRouter([
    {
      path: "/",
      element: <Home />
    },

    {
      path: "/login",
      element: (
        <PublicOnlyRoute>
          <Login />
        </PublicOnlyRoute>
      )
    },

    {
      path: "/otp",
      element: (
        <PublicOnlyRoute>
          <OTPVerification />
        </PublicOnlyRoute>
      )
    },

    {
      path: "/reset-password",
      element: (
        <PublicOnlyRoute>
          <ForgotPassword />
        </PublicOnlyRoute>
      )
    },

    {
      element: <ProtectedRoute />,
      children: [
        {
          path: "/profile",
          element: <Profile />
        },
        {
          path: "/analysis",
          element: <Analysis />
        }
      ]
    },
    {
      path: "*",
      element: <NotFound />
    }
  ]);

  return (
    <AuthProvider>
      <RouterProvider router={router} />
    </AuthProvider>
  )
}

export default App
