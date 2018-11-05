const resolvers = {
    Openload: require('./Openload').OpenloadHtml,
    Streamango: require('./Streamango'),
    RapidVideo: require('./RapidVideo'),
    AZMovies: require('./AZMovies'),
    Vidlox: require('./Vidlox'),
    VShare: require('./VShare'),
    SpeedVid: require('./SpeedVid'),
    VidCloud: require('./VidCloud'),
    ClipWatching: require('./ClipWatching'),
    EStream: require('./EStream'),
    Vidzi: require('./Vidzi'),
    VidTodo: require('./VidTodo'),
    PowVideo: require('./PowVideo'),
    GamoVideo: require('./GamoVideo'),
    GorillaVid: require('./GorillaVid'),
    DaClips: require('./DaClips'),
    MovPod: require('./MovPod'),
    Vidoza: require('./Vidoza')
};

const createEvent = require('../../utils/createEvent');

async function resolve(html, resolver, jar, headers) {
    try {
        const data = resolvers[resolver](html, jar, headers);
    } catch(err) {
        console.error(err);
    }
}

module.exports = exports = resolve;