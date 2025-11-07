import { type RouteConfig, index, layout, route } from "@react-router/dev/routes";

export default [
  // Landing page (shown only when not logged in)
  index("routes/_index.tsx"),

  // Public invite landing page
  route("invite/:code", "routes/invite.$code.tsx"),

  // Auth routes (pathless layout)
  layout("routes/_auth.tsx", [
    route("login", "routes/_auth.login.tsx"),
    route("signup", "routes/_auth.signup.tsx"),
  ]),

  // Dashboard routes (pathless layout, protected)
  layout("routes/_dashboard.tsx", [
    route("home", "routes/_dashboard._index.tsx"),
    route("profile", "routes/_dashboard.profile.tsx"),
    route("settings", "routes/_dashboard.settings.tsx"),
    route("local-data", "routes/_dashboard.local-data.tsx"),
    route("posts/new", "routes/_dashboard.posts.new.tsx"),
    route("posts/:postId", "routes/_dashboard.posts.$postId.tsx"),
    route("messages", "routes/_dashboard.messages._index.tsx"),
    route("messages/new", "routes/_dashboard.messages.new.tsx"),
    route("messages/:threadId", "routes/_dashboard.messages.$threadId.tsx"),
    route("communities", "routes/_dashboard.communities._index.tsx"),
    route("communities/:communitySlug", "routes/_dashboard.communities.$communitySlug.tsx"),
    route("hangouts", "routes/_dashboard.hangouts._index.tsx"),
    route("qr-approve", "routes/_dashboard.qr-approve.tsx"),
  ]),

  // API routes (resource routes)
  route("api/health", "routes/api.health.tsx"),
  route("api/stats", "routes/api.stats.tsx"),
  route("api/post", "routes/api.post.tsx"),
  route("api/posts/:postId/like", "routes/api.posts.$postId.like.tsx"),
  route("api/posts/:postId/likes", "routes/api.posts.$postId.likes.tsx"),
  route("api/logout", "routes/api.logout.tsx"),
  route("api/users/search", "routes/api.users.search.tsx"),
  route("api/images/upload", "routes/api.images.upload.tsx"),
  route("api/images/debug", "routes/api.images.debug.tsx"),
  route("api/images/:imageId", "routes/api.images.$imageId.tsx"),
  route("api/auth/register-options", "routes/api.auth.register-options.tsx"),
  route("api/auth/register-verify", "routes/api.auth.register-verify.tsx"),
  route("api/auth/login-options", "routes/api.auth.login-options.tsx"),
  route("api/auth/login-verify", "routes/api.auth.login-verify.tsx"),
  route("api/auth/qr-token", "routes/api.auth.qr-token.tsx"),
  route("api/auth/qr-login", "routes/api.auth.qr-login.tsx"),
  route("api/auth/qr-poll", "routes/api.auth.qr-poll.tsx"),

  // Messages API routes
  route("api/messages/poll", "routes/api.messages.poll.tsx"),
  route("api/messages/load-more", "routes/api.messages.load-more.tsx"),
  route("api/messages/threads", "routes/api.messages.threads.tsx"),
  route("api/messages/threads/create", "routes/api.messages.threads.create.tsx"),
  route("api/messages/threads/:threadId", "routes/api.messages.threads.$threadId.tsx"),
  route("api/messages/threads/:threadId/participants", "routes/api.messages.threads.$threadId.participants.tsx"),

  // Referral & Invite API routes
  route("api/invites/code", "routes/api.invites.code.tsx"),

  // Follows API routes
  route("api/follows", "routes/api.follows.tsx"),

  // Connections API routes
  route("api/connections/request", "routes/api.connections.request.tsx"),
  route("api/connections/:id/accept", "routes/api.connections.$id.accept.tsx"),
  route("api/connections/:id/decline", "routes/api.connections.$id.decline.tsx"),
  route("api/connections/pending", "routes/api.connections.pending.tsx"),

  // Legacy redirect
  route("home", "routes/home.tsx"),

  // Catch-all route (must be last)
  route("*", "routes/$.tsx"),
] satisfies RouteConfig;
