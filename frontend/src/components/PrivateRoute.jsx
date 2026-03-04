import { Navigate, useLocation } from 'react-router-dom';

const PrivateRoute = ({ children }) => {
    const isLoggedIn = !!localStorage.getItem('userId');
    const location = useLocation();

    return isLoggedIn ? (
        children
    ) : (
        <Navigate
            to="/"
            replace
            state={{ from: location.pathname }}
        />
    );
};

export default PrivateRoute;