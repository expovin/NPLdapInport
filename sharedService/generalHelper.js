

module.exports = {
    'echo' : (get) => {
        var back = "You sent me "+get;
        return back;
    },

    'getCookie' : (cookies) => {

        return  cookies.map((x) => { 
            return x.split(";")[0];
        });
        
    },

    'oneString' : (cookies) => {
        str="";
        cookies.forEach ( (cookie) => {
            str+=cookie+"; "
        })
        return str;
    },

    'replaceSessionId' : (cookies, oldSession) => {
        newCookies = [];
        cookies.forEach((cookie) => {
            if(cookie != oldSession){
                
                newCookies.push(cookie);
            } else
            console.log("Cookie to delete :",cookie);

        });
        return newCookies;
    },

    'getToken' : (cookies,key) => {
        doc= {};
        cookies.forEach( (cookie) => {
            eq = cookie.indexOf("=");
            cookie_key = cookie.substring(0,eq);
            cookie_val = cookie.substring(eq+1, cookie.length);
            doc[cookie_key]=cookie_val;
        });

        return doc[key];
    }
    
}