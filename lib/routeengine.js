/**
 * route engine
 */
 
var route = function(cfgs, parameters, at) {
    for(var cfgKey in cfgs) {
        var cfg = cfgs[cfgKey];
        var value = at(cfg.name);
        if(!value)
            continue;
            
        if (cfg.regex) {
            var matching = cfg.regex.exec(value);
            if (!matching || !matching[1]) {
                continue;
            }
            value = matching[1];
        }
        
        var rets = parameters ? parameters.slice(0) : [];
        var mappingto = cfg.hashEntries[value] || cfg.hashEntries['*'];
        if (!mappingto) {
            // Find the entry in regEntries
            var regEntries = cfg.regEntries;
            for(var key in regEntries) {
                // Regex testing.
                var rets = regEntries[key][0].exec(value);
                
                // If regex matched. The r[1] was the first matched word and continue so on.
                if (rets) {
                    // Push ans save matched keys.
                    for (var i = 1; i < rets.length; i++) {
                        rets.push(rets[i]);
                    }
                    mappingto = regexmappings[key][1];
                }
            }
        } else {
            // Push and save the entry name into matched array.
            rets.push(value);
        }
        
        if (mappingto) {
            var tp = toString.call(mappingto);
            if (tp === '[object String]' || tp === '[object Object]') {
                rets.unshift(mappingto);  
                return rets;
            } else {
                rets = route(mappingto, rets, at);
                if (rets) {
                    // Return only if mapping entry founded.
                    return rets;
                }
            }
        }
    }
};

exports.compile = function (settings) {
    if (toString.call(settings) === '[object String]') {
        return function () {
            return settings
        }
    } else {
        // Prepare real routing configuration
        var routeCfgs = new Array();
        for (var sectionKey in settings) {
            var name = settings[sectionKey].name;
            var regex = settings[sectionKey].regex;
            var mappings = settings[sectionKey].mappings;
            var routeCfg = {
                name : name,
                regex : regex,
                hashEntries : {},
                regEntries : []
            };
            
            for(var itemKey in mappings) {
                var key = mappings[itemKey][0];
                var mappingto = mappings[itemKey][1];
                switch (toString.call(key)) {
                    case '[object String]' :
                        routeCfg.hashEntries[key] = mappingto;
                        break;
                    case '[object RegExp]' : 
                        routeCfg.regEntries.push(
                            [key, exports.compile(mappingto)]
                        );
                        break;
                    default:
                }
            }
            routeCfgs.push(routeCfg);
        }
    
        return function (at) {
            return route(routeCfgs, undefined, at);
        }
    }
};