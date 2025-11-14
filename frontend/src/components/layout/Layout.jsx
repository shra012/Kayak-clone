import { useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import { toggleSidebar, setTheme } from "../../store/slices/uiSlice";
import { FaBars } from "react-icons/fa";
import AnimatedIcon from "../common/AnimatedIcon";

const Layout = ({ children }) => {
  const { isAuthenticated, logout, isAdmin, user } = useAuth();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { theme, sidebarOpen } = useSelector((state) => state.ui);

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const handleThemeChange = (e) => {
    dispatch(setTheme(e.target.value));
  };

  useEffect(() => {
    const savedTheme = localStorage.getItem("theme") || "light";
    document.documentElement.setAttribute("data-theme", savedTheme);
  }, [theme]);

  const initials = (() => {
    const first = user?.firstName?.trim()?.charAt(0) || "";
    const last = user?.lastName?.trim()?.charAt(0) || "";
    const combined = `${first}${last}` || user?.email?.charAt(0) || "U";
    return combined.toUpperCase();
  })();

  return (
    <div className="min-h-screen bg-base-100 text-base-content">
      <div className="navbar bg-base-100 border-b border-base-300 shadow-sm">
        <div className="navbar-start">
          <div className="dropdown">
            <div tabIndex={0} role="button" className="btn btn-ghost lg:hidden">
              <AnimatedIcon>
                <FaBars className="h-5 w-5" />
              </AnimatedIcon>
            </div>
            <ul
              tabIndex={0}
              className="menu menu-sm dropdown-content mt-3 z-[1] p-2 shadow bg-base-100 rounded-box w-52"
            >
              <li>
                <Link to="/flights">Flights</Link>
              </li>
              <li>
                <Link to="/hotels">Hotels</Link>
              </li>
              <li>
                <Link to="/cars">Cars</Link>
              </li>
            </ul>
          </div>
          <Link
            to="/"
            className="btn btn-ghost text-xl font-bold text-primary logo-shine"
          >
            Kayak
          </Link>
        </div>
        <div className="navbar-center hidden lg:flex">
          <ul className="menu menu-horizontal px-1">
            <li>
              <Link to="/flights">Flights</Link>
            </li>
            <li>
              <Link to="/hotels">Hotels</Link>
            </li>
            <li>
              <Link to="/cars">Cars</Link>
            </li>
            {isAuthenticated && (
              <>
                <li>
                  <Link to="/bookings">Bookings</Link>
                </li>
                <li>
                  <Link to="/concierge">Concierge</Link>
                </li>
              </>
            )}
          </ul>
        </div>
        <div className="navbar-end">
          <select
            className="select select-bordered select-sm mr-2 bg-base-100"
            value={theme}
            onChange={handleThemeChange}
          >
            <option value="light">Light</option>
            <option value="dark">Dark</option>
            <option value="cupcake">Cupcake</option>
          </select>
          {isAuthenticated ? (
            <div className="dropdown dropdown-end">
              <button
                type="button"
                tabIndex={0}
                className="btn btn-ghost btn-circle"
              >
                <span className="w-12 h-12 rounded-full bg-primary text-primary-content flex items-center justify-center font-semibold text-lg uppercase leading-none">
                  {initials}
                </span>
              </button>
              <ul
                tabIndex={0}
                className="menu menu-sm dropdown-content mt-3 z-[1] p-2 shadow bg-base-100 rounded-box w-52"
              >
                <li>
                  <Link to="/users">Profile</Link>
                </li>
                {isAdmin() && (
                  <li>
                    <Link to="/admin">Admin</Link>
                  </li>
                )}
                <li>
                  <a onClick={handleLogout}>Logout</a>
                </li>
              </ul>
            </div>
          ) : (
            <Link to="/login" className="btn btn-primary">
              Login
            </Link>
          )}
        </div>
      </div>

      <main>{children}</main>

      <footer className="footer footer-center p-4 bg-base-200 text-base-content">
        <aside>
          <p>© 2024 Kayak Simulation Platform. All rights reserved.</p>
        </aside>
      </footer>
    </div>
  );
};

export default Layout;
