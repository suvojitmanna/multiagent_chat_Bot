import proxy from "express-http-proxy";

export const proxyWithHeader = (serviceUrl, options = {}) => {
    return proxy(serviceUrl, {
        parseReqBody: false,
        timeout: 120000,
        proxyReqPathResolver: (req) => {
            if (options.pathPrefix) {
                const prefix = options.pathPrefix.endsWith("/")
                    ? options.pathPrefix.slice(0, -1)
                    : options.pathPrefix;
                const path = req.url.startsWith("/") ? req.url : "/" + req.url;
                return prefix + path;
            }
            return req.url;
        },
        proxyReqOptDecorator: (proxyReqOpts, srcReq) => {
            const userId = srcReq?.user?.userId || srcReq?.user?._id || srcReq?.user?.id;
            if (userId) {
                proxyReqOpts.headers["x-user-id"] = userId.toString();
            }
            return proxyReqOpts;
        },
        userResHeaderDecorator: (headers, userReq) => {
            const origin = userReq.headers.origin;
            if (origin) {
                headers["access-control-allow-origin"] = origin;
                headers["access-control-allow-credentials"] = "true";
            }
            headers["access-control-allow-methods"] = "GET, POST, PUT, DELETE, OPTIONS, PATCH";
            headers["access-control-allow-headers"] = "Content-Type, Authorization, x-user-id";
            return headers;
        }
    });
};