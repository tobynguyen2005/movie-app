import { BrowserRouter as Router, Routes, Route, Navigate, Link } from 'react-router-dom';
import { Film, Users, Sun, Moon, Tags } from 'lucide-react';
import MoviesPage from './pages/MoviesPage';
import ActorsPage from './pages/ActorsPage';
import GenresPage from './pages/GenresPage';
import { useDarkMode } from './hooks/useDarkMode'; // Import Hook

function App() {
  const { isDark, toggleDarkMode } = useDarkMode(); // Sử dụng Hook

  return (
    <Router>
      {/* Thêm dark:bg-gray-900 vào wrapper ngoài cùng */}
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex transition-colors duration-300">
        
        {/* Sidebar có thêm các class dark: */}
        <aside className="w-64 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 p-4 flex flex-col transition-colors duration-300">
          <h1 className="text-xl font-black text-indigo-600 dark:text-indigo-400 mb-8 flex items-center gap-2">
            My Movie App
          </h1>
          
          <nav className="space-y-2 flex-1">
            <Link to="/movies" className="flex items-center gap-3 px-4 py-3 rounded-lg text-gray-700 dark:text-gray-200 hover:bg-indigo-50 dark:hover:bg-gray-700 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors font-medium">
              <Film className="w-5 h-5" /> Phim của tôi
            </Link>
            <Link to="/actors" className="flex items-center gap-3 px-4 py-3 rounded-lg text-gray-700 dark:text-gray-200 hover:bg-indigo-50 dark:hover:bg-gray-700 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors font-medium">
              <Users className="w-5 h-5" /> Diễn viên
            </Link>
            <Link to="/genres" className="flex items-center gap-3 px-4 py-3 rounded-lg text-gray-700 dark:text-gray-200 hover:bg-indigo-50 dark:hover:bg-gray-700 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors font-medium">
            <Tags className="w-5 h-5" /> Thể loại
          </Link>
          </nav>

          {/* Nút Đổi Theme ở dưới cùng Sidebar */}
          <button 
            onClick={toggleDarkMode}
            className="flex items-center gap-3 px-4 py-3 mt-auto rounded-lg text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors font-medium w-full"
          >
            {isDark ? (
              <>
                <Sun className="w-5 h-5 text-amber-400" /> Chế độ Sáng
              </>
            ) : (
              <>
                <Moon className="w-5 h-5 text-slate-600" /> Chế độ Tối
              </>
            )}
          </button>
        </aside>

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto">
          <Routes>
            <Route path="/movies" element={<MoviesPage />} />
            <Route path="/actors" element={<ActorsPage />} />
            <Route path="/genres" element={<GenresPage />} />
            <Route path="/" element={<Navigate to="/movies" replace />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;