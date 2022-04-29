# Omilia_PoC_OAuth
 
This repo contains starter code for using OAuth 2.0 for authentication inside of OCP MiniApps. This is implemented via a Node.js web service that generates a Google consent screen and upon recieving permission, uses the resulting access-token to authenticate the user via their Google profile information.

Note that while some things, like request time-out durations, have been configured to work well with OCP MiniApps, nothing about this approach relies on unique features offered by OCP Miniapps. It should therefore be possible to implement something similar to this approach on other platforms.

## Web Service Configuration

1. Install npm libraries

        npm install
        
2. [Follow this guide](https://developers.google.com/identity/protocols/oauth2/web-server#httprest_3) to create OAuth 2.0 authorization credentials. This will provide the values for YOUR_CLIENT_ID and YOUR_CLIENT_SECRET. This guide also discusses how to change the scope of the request.

3. Set up ngrok to allow MiniApps to access the web service, see the document "Omilia MiniApps Tutorial - Accessing Data.pdf" for details. 

4. Update YOUR_REDIRECT_URL with your ngrok domain (eg."https://fddc-198-2-93-234.ngrok.io/oauth-callback"). Also add this as an "Authorized Redirect URI" in your Google Cloud Platform credentials configuration. 

5. If you would like to set up the sample Mongodb database used for authentication in this example, the procedure is also detailed in the pdf from step 3. Most of the code related to this in index.js is copied from the appendix of this pdf.

## OCP MiniApps Configuration

The Accompanying OCP MiniApps application is "TeemingDatabaseTesting" in the dlewis group.

If you're testing or modifying this project, simply update the "domain" value in the Set Field block at the start of the main application flow to your web service domain. If you want to integrate OAuth 2.0 with another project please see the Additional Details section for tips regarding the OCP implementation.

## Procedure and Explanation

### Note:

The procedure below is specific to the Streamline Vacation Rentals demo project where authentication is accomplished by obtaining the user's phone number and using it to query a database for their reservation information. Therefore, this procedure details using OAuth 2.0 to obtain a phone number from a google profile. 

By modifying the scope of the oauth consent request, it should be possible to use the same rough procedure to access user information from any Google API.

### Steps:

1. User is asked whether they would like to sign-in to Google to have their identity verified. User says yes.

2. Miniapps sends a GET request to /authurl to obtain the Google consent screen URL from the Node.js webservice. This is presented to the user in an announcement.

3. Simultaneously, Miniapps sends a GET request to /oauthnum. This won't return anything until the user has completed the sign-in process.

4. The user clicks the link, opening a popup where they can sign into their google account. Once they have signed in the popup window is redirected to \<domain\>/oauth-callback
![image](https://user-images.githubusercontent.com/102549069/166066388-61c258b8-feb7-4506-a108-5cdc6f8f7d17.png)


5. The /oauth-callback endpoint extracts the "code" parameter from the redirect URL and exchanges it for an access-token as per OAuth 2.0 procedure.

6. The access-token is used to retrieve the user's phone number from the Google Profile API. 

7. Once the phone number is obtained, the GET request to /oauthnum initiated in step 3 will return it to MiniApps

8. Miniapps can then use the phone number to authenticate the user. For demo purposes this is accomplished through a GET request to the /users endpoint of the same webservice, which queries a sample database.

![image](https://user-images.githubusercontent.com/102549069/166066852-fc7fce2b-9215-4ff5-8c05-3aa5463d96e7.png)

## Additional Details

1. To open the consent screen url as a popup copy-paste the following HTML tag into an announcement MiniApp and pass the Google consent screen url as extValue1.

    `<a href="#" onClick="MyWindow=window.open('{{extValue1}}', 'MyWindow','width=600,height=600'); return false;">Click To Sign-In To Google</a>`
    
2. If you're using ngrok I recommend passing the domain as a variable to all of your web service miniapps so you don't have to manually edit every web service miniapp everytime you restart ngrok. It's passed as extValue10 below.

![image](https://user-images.githubusercontent.com/102549069/166071262-12bb51ce-8168-438b-9bf8-10074c33045b.png)

3. While optimally the GET request to /oauthnum from Procedure Step 3 would wait for a value indefinitely, the miniapps chat window will crash if it recieves no response after ~9 seconds. Because of this, if no phone number is availble after ~8 seconds it will return the value "0" to miniapps.
