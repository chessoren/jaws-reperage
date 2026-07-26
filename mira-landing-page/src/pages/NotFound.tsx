import { Link } from "react-router-dom";

const NotFound = () => (
  <div className="flex min-h-screen flex-col items-center justify-center gap-2">
    <h1 className="text-4xl font-bold">404</h1>
    <p className="text-muted-foreground">Page not found</p>
    <Link to="/" className="underline underline-offset-2">
      Back to home
    </Link>
  </div>
);

export default NotFound;
