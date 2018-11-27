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

async function resolveHtml(html, resolver, jar, headers) {
    const data = await resolvers[resolver](html, jar, headers);

    if (resolver === 'Openload') {
        return [createEvent(data, false, {}, '', 'Openload')];

    } else if (resolver === 'Streamango') {
        return [createEvent(data, false, {}, '', 'Streamango')];

    } else if (resolver === 'VShare') {
        return [createEvent(data, false, {}, '', 'VShare')];

    } else if (resolver === 'PowVideo') {
        const dataList = [];
        data.forEach(dataObject => {
            dataList.push(createEvent(!!dataObject.file ? dataObject.file : dataObject.link, false, {}, '', 'PowVideo'));
        });
        return dataList;

    } else if (resolver === 'GamoVideo') {
        const dataList = [];
        data.forEach(dataObject => {
            dataList.push(createEvent(dataObject, false, {}, '', 'GamoVideo'));
        });
        return dataList;

    } else if (resolver === 'Vidoza') {
        const dataList = [];
        data.forEach(dataObject => {
            dataList.push(createEvent(dataObject.src, false, {}, dataObject.res, 'Vidoza'));
        });
        return dataList;

    } else {
        throw `Resolver ${resolver} not supported`;
    }
}

module.exports = exports = resolveHtml;