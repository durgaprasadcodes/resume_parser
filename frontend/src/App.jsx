import './App.css'
import { createBrowserRouter, Outlet, RouterProvider, useLocation } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { ToastContainer } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'
import Home from './pages/Home'
import Analysis from './pages/Analysis'
import Profile from './pages/Profile'
import Login from './auth/Auth'
import NotFound from './pages/NotFound'
import OTPVerification from './auth/OTPVerification.jsx'
import ForgotPassword from './auth/ForgotPassword.jsx'
import { AuthProvider } from './auth/AuthContext.jsx'
import { ProtectedRoute, PublicOnlyRoute } from './pages/ProtectedRoute'
import LoadingAnimation1 from './anim/LoadingAnimation1'
import Warning from './build/warning.jsx'

function RouteLoadingLayout() {
  const location = useLocation()
  const [loadedPath, setLoadedPath] = useState(location.pathname)

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      setLoadedPath(location.pathname)
    }, 450)

    return () => window.clearTimeout(timeout)
  }, [location.pathname])

  return (
    <>
      <Outlet />
      {loadedPath !== location.pathname && <LoadingAnimation1 />}
    </>
  )
}

function App() {
  const router = createBrowserRouter([
    {
      path: "/",
      element: <RouteLoadingLayout />,
      children: [
        {
          index: true,
          element: <Home />
        },
        {
          path: "login",
          element: (
            <PublicOnlyRoute>
              <Login />
            </PublicOnlyRoute>
          )
        },
        {
          path: "otp",
          element: (
            <PublicOnlyRoute>
              <OTPVerification />
            </PublicOnlyRoute>
          )
        },
        {
          path: "reset-password",
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
              path: "profile",
              element: <Profile />
            },
            {
              path: "check_ats_score",
              element: <Analysis />
            },
            {
              path: "build_resume",
              element: <Warning />
            }
          ]
        },
        {
          path: "*",
          element: <NotFound />
        }
      ]
    }
  ]);

  return (
    <AuthProvider>
      <RouterProvider router={router} />
      <ToastContainer
        position="bottom-right"
        autoClose={3500}
        hideProgressBar={false}
        newestOnTop
        closeOnClick
        pauseOnHover
        draggable
        theme="dark"
        stacked
      />
    </AuthProvider>
  )
}

export default App
