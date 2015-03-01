$(document).ready(function(){
	var api_key = '3f855023e26ca36293ca08b020cb2be3',
	    api_secret = 'dd126cbe18ce605c',
	    checkPopup,
	    popup,
	    token,
	    frob;
	window.rtm = new RememberTheMilk(api_key, api_secret, 'delete');
	rtm.get('rtm.auth.getFrob', function(resp){
		$('#auth').attr('disabled', null);
		frob = resp.rsp.frob;
	});
	$('#auth').click(function(){
		var authUrl = rtm.getAuthUrl(frob);
		popup = window.open(authUrl);
		checkPopup = setInterval(function(){
			if (popup.closed == true) {
				clearInterval(checkPopup);
				rtm.get('rtm.auth.getToken', {frob: frob}, function(resp){
					rtm.auth_token = resp.rsp.auth.token;
					loadLists();
				});
			}
		}, 200);
	})
});