import { useEffect } from "react";



const GetButtonWidget = () => {

  useEffect(() => {

    const options = {

      whatsapp: "254706622557",

      call_to_action: "Message us",

      position: "right",

    };



    const proto = document.location.protocol;

    const host = "getbutton.io";

    const url = `${proto}//static.${host}`;



    const script = document.createElement("script");

    script.type = "text/javascript";

    script.async = true;

    script.src = `${url}/widget-send-button/js/init.js`;



    script.onload = () => {

      if ((window as any).WhWidgetSendButton) {

        (window as any).WhWidgetSendButton.init(host, proto, options);

      }

    };



    document.body.appendChild(script);



    return () => {

      document.body.removeChild(script);

    };

  }, []);



  return null; // nothing renders visually from React

};



export default GetButtonWidget;