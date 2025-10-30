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
    route("communities", "routes/_dashboard.communities._index.tsx"),
    route("communities/:communitySlug", "routes/_dashboard.communities.$communitySlug.tsx"),
  ]),

  // API routes (resource routes)
  route("api/post", "routes/api.post.tsx"),
  route("api/logout", "routes/api.logout.tsx"),
  route("api/auth/register-options", "routes/api.auth.register-options.tsx"),
  route("api/auth/register-verify", "routes/api.auth.register-verify.tsx"),
  route("api/auth/login-options", "routes/api.auth.login-options.tsx"),
  route("api/auth/login-verify", "routes/api.auth.login-verify.tsx"),

  // Legacy redirect
  route("home", "routes/home.tsx"),
] satisfies RouteConfig;
