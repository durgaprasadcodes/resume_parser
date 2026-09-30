import './App.css'
import { createBrowserRouter, RouterProvider } from 'react-router-dom'
import Home from './pages/Home'
import Upload from './pages/Upload'
import Analysis from './pages/Analysis'
import Profile from './pages/Profile'
import Auth from './auth/Auth'
import NotFound from './pages/NotFound'
import Loading from './anim/Loading'
import ProtectedRoute from './pages/ProtectedRoute'

function App() {
  const router = createBrowserRouter([
    {
      path: "/",
      element: <Home />,
    },
    {
      path: "/auth",
      element: <Auth />
    },
    {
      path: "/load",
      element: <Loading />
    },
    {
      element: <ProtectedRoute />,
      children: [
        {
          path: "/upload",
          element: <Upload />
        },
        {
          path: "/analysis",
          element: <Analysis />
        },
        {
          path: "/profile",
          element: <Profile />
        }
      ]
    },
    {
      path: "*",
      element: <NotFound />
    }
  ])
  return <RouterProvider router={router} />
}

export default App
