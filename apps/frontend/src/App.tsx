import { BrowserRouter, Routes, Route } from 'react-router-dom';
import MainLayout from './layouts/MainLayout';

// Tạo nhanh các Component tạm thời để test
const Dashboard = () => <div><h1>Dashboard Page</h1><p>Chào mừng bạn quay lại!</p></div>;
const Workspace = () => <div><h1>Workspace Page</h1><p>Nơi làm việc chung thời gian thực.</p></div>;
const Login = () => <div style={{ textAlign: 'center', marginTop: '50px' }}><h1>Login Page</h1></div>;

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Nhóm trang dùng MainLayout */}
        <Route element={<MainLayout />}>
          <Route path="/" element={<Dashboard />} />
          <Route path="/workspace/:id" element={<Workspace />} />
        </Route>

        {/* Trang đăng nhập riêng biệt */}
        <Route path="/login" element={<Login />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;