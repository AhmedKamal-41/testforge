import { Link, NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../stores/auth";

export function NavBar() {
  const navigate = useNavigate();
  const { user, token, clear } = useAuth();

  const handleLogout = () => {
    clear();
    navigate("/login");
  };

  const linkClass = ({ isActive }: { isActive: boolean }) =>
    `text-sm font-medium ${isActive ? "text-slate-900" : "text-slate-500"} hover:text-slate-900`;

  return (
    <header className="border-b border-slate-200 bg-white">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-3">
        <Link to="/products" data-testid="brand-link" className="text-lg font-semibold text-slate-900">
          ShopLite
        </Link>
        <nav className="flex items-center gap-6">
          <NavLink to="/products" data-testid="nav-products" className={linkClass}>
            Products
          </NavLink>
          {token && (
            <>
              <NavLink to="/cart" data-testid="nav-cart" className={linkClass}>
                Cart
              </NavLink>
              <NavLink to="/orders" data-testid="nav-orders" className={linkClass}>
                Orders
              </NavLink>
            </>
          )}
          {user?.role === "admin" && (
            <NavLink to="/admin/products" data-testid="nav-admin" className={linkClass}>
              Admin
            </NavLink>
          )}
          {token ? (
            <div className="flex items-center gap-3">
              <span data-testid="current-user" className="text-sm text-slate-500">
                {user?.email ?? ""}
              </span>
              <button
                type="button"
                data-testid="logout-button"
                onClick={handleLogout}
                className="rounded-md border border-slate-300 px-3 py-1 text-sm font-medium text-slate-700 hover:bg-slate-100"
              >
                Log out
              </button>
            </div>
          ) : (
            <NavLink to="/login" data-testid="nav-login" className={linkClass}>
              Log in
            </NavLink>
          )}
        </nav>
      </div>
    </header>
  );
}
