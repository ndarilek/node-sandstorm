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
    sessionId: req.headers["x-sandstorm-session-id"],
    user: {
      name: unescape(req.headers["x-sandstorm-username"]),
      id: req.headers["x-sandstorm-user-id"],
      tabId: req.headers["x-sandstorm-tab-id"],
      preferredHandle: req.headers["x-sandstorm-preferred-handle"],
      picture: req.headers["x-sandstorm-user-picture"],
      pronouns: req.headers["x-sandstorm-user-pronouns"]
    },
    hasPermission: (permission) => req.sandstorm.permissions && req.sandstorm.permissions.indexOf(permission) != -1,
    hackSessionContext: () => newHackSessionContext(req.sandstorm.sessionId)
  }
  if(req.headers["x-sandstorm-permissions"])
    req.sandstorm.user.permissions = req.headers["x-sandstorm-permissions"].split(",")
  else
    req.sandstorm.user.permissions = []
  next()
}
