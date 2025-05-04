import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { BaseLayout } from './components/layout/BaseLayout';
import { AuthGuard } from './components/auth/AuthGuard';
import { Login } from './components/auth/Login';
import { SignUp } from './components/auth/SignUp';
import { Home } from './components/pages/Home';
import { CreateNewspaper } from './components/pages/CreateNewspaper';
import { MyNewspapers } from './components/pages/MyNewspapers';
import { Profile } from './components/pages/Profile';

const App = () => {
  return (
    <Router>
      <BaseLayout>
        <Routes>
          {/* 認証不要のルート */}
          <Route path="/" element={<Home />} />
          <Route
            path="/login"
            element={
              <AuthGuard requireAuth={false}>
                <Login />
              </AuthGuard>
            }
          />
          <Route
            path="/signup"
            element={
              <AuthGuard requireAuth={false}>
                <SignUp />
              </AuthGuard>
            }
          />

          {/* 認証が必要なルート */}
          <Route
            path="/create"
            element={
              <AuthGuard>
                <CreateNewspaper />
              </AuthGuard>
            }
          />
          <Route
            path="/my-newspapers"
            element={
              <AuthGuard>
                <MyNewspapers />
              </AuthGuard>
            }
          />
          <Route
            path="/profile"
            element={
              <AuthGuard>
                <Profile />
              </AuthGuard>
            }
          />
        </Routes>
      </BaseLayout>
    </Router>
  );
};

export default App;
