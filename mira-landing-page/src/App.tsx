import { BrowserRouter, HashRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";

// The single-file export (dist-single) can be served from any path, so it is
// built with VITE_HASH_ROUTER=1 and routes on the hash instead of the pathname.
const Router = import.meta.env.VITE_HASH_ROUTER ? HashRouter : BrowserRouter;

const App = () => (
  <Router>
    <Routes>
      <Route path="/" element={<Index />} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  </Router>
);

export default App;
