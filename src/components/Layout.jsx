// Layout wrapper – renders Sidebar + main content area
import Sidebar from "./Sidebar";

export default function Layout({ children }) {
    return (
        <div className="app-layout">
            <Sidebar />
            <main className="main-content">
                <div className="page-wrapper fade-in">{children}</div>
            </main>
        </div>
    );
}
