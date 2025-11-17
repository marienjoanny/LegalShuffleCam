// PeerJS init
  peer = new Peer(savedId || undefined, {
    peer.on("open", id => {

      window.myPeerId = id;

      sessionStorage.setItem("peerId", id);



      const urlParams = new URLSearchParams(window.location.search);

      const partnerId = urlParams.get("partnerId");

      const callerId = urlParams.get("callerId");



      if (partnerId && !callerId) {

        const newUrl = new URL(window.location.href);

        newUrl.searchParams.set("callerId", id);

        window.location.replace(newUrl.toString());

        return;

      }



      if (partnerId && callerId) {

        console.log("📞 Appel direct déclenché vers", partnerId);

        handleDirectCall(partnerId);

      }

    });
    host: 'legalshufflecam.ovh',
    peer.on("open", id => {

      window.myPeerId = id;

      sessionStorage.setItem("peerId", id);



      const urlParams = new URLSearchParams(window.location.search);
