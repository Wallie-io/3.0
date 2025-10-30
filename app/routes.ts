import { type RouteConfig, index, layout, route } from "@react-router/dev/routes";

export default [
  // Auth routes (pathless layout)
  layout("routes/_auth.tsx", [
    route("login", "routes/_auth.login.tsx"),
    route("signup", "routes/_auth.signup.tsx"),
  ]),

  // Dashboard routes (pathless layout, protected)
  layout("routes/_dashboard.tsx", [
    index("routes/_dashboard._index.tsx"),
    route("profile", "routes/_dashboard.profile.tsx"),
    route("local-data", "routes/_dashboard.local-data.tsx"),
    route("messages", "routes/_dashboard.messages._index.tsx"),
    route("messages/:threadId", "routes/_dashboard.messages.$threadId.tsx"),
  ]),

  // Legacy redirect
  route("home", "routes/home.tsx"),
] satisfies RouteConfig;
