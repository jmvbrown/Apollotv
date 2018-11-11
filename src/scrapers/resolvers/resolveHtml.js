const resolvers = {
    Openload: require('./Openload').OpenloadHtml,
    Streamango: require('./Streamango').StreamangoHtml,
    // RapidVideo: require('./RapidVideo'),
    // AZMovies: require('./AZMovies'),
    // Vidlox: require('./Vidlox'),
    VShare: require('./VShare').VShareHtml,
    // SpeedVid: require('./SpeedVid'),
    // VidCloud: require('./VidCloud'),
    // ClipWatching: require('./ClipWatching'),
    // EStream: require('./EStream'),
    // Vidzi: require('./Vidzi'),
    // VidTodo: require('./VidTodo'),
    PowVideo: require('./PowVideo').PowVideoHtml,
    GamoVideo: require('./GamoVideo').GamoVideoHtml,
    // GorillaVid: require('./GorillaVid'),
    // DaClips: require('./DaClips'),
    // MovPod: require('./MovPod'),
    Vidoza: require('./Vidoza').VidozaHtml
};

const createEvent = require('../../utils/createEvent');

function resolve(html, resolver, jar, headers) {
    return resolvers[resolver](html, jar, headers);
}

module.exports = exports = resolve;