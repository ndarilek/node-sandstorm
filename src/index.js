import Capnp from "capnp"

const capnpRoot = "/opt/sandstorm/latest/usr/include/sandstorm"

const HackSessionContext = Capnp.import(`${capnpRoot}/hack-session.capnp`).HackSessionContext
const HttpBridge = Capnp.import(`${capnpRoot}/sandstorm-http-bridge.capnp`).SandstormHttpBridge

export const newHackSessionContext = (sessionId) => {
  const conn = Capnp.connect("unix:/tmp/sandstorm-api")
  const cap = conn.restore(null, HttpBridge)
  return cap.getSessionContext(sessionId)
    .then((v) => v.castAs(HackSessionContext))
}

export const sandstormMiddleware = (req, res, next) => {
  req.sandstorm = {
    sessionId: req.headers["X-Sandstorm-Session-Id"],
    user: {
      name: unescape(req.headers["X-Sandstorm-Username"]),
      id: req.headers["X-Sandstorm-User-Id"],
      tabId: req.headers["X-Sandstorm-Tab-Id"],
      preferredHandle: req.headers["X-Sandstorm-Preferred-Handle"],
      picture: req.headers["X-Sandstorm-User-Picture"],
      pronouns: req.headers["X-Sandstorm-User-Pronouns"]
    },
    hasPermission: (permission) => req.sandstorm.permissions && req.sandstorm.permissions.indexOf(permission) != -1,
    hackSessionContext: () => newHackSessionContext(req.sandstorm.sessionId)
  }
  if(req.headers["X-Sandstorm-Permissions"])
    req.sandstorm.user.permissions = req.headers["X-Sandstorm-Permissions"].split(",")
  else
    req.sandstorm.user.permissions = []
  next()
}
