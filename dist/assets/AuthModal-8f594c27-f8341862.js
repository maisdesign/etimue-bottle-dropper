import{u as n,y as r}from"./index-e955accf.js";import"./supabase-cf010ec4.js";var p=Object.defineProperty,v=(l,e,t)=>e in l?p(l,e,{enumerable:!0,configurable:!0,writable:!0,value:t}):l[e]=t,u=(l,e,t)=>(v(l,typeof e!="symbol"?e+"":e,t),t);class b{constructor(){u(this,"element"),u(this,"onAuthCallback"),u(this,"currentStep","welcome"),u(this,"currentEmail",""),this.element=this.createElement(),this.setupEventListeners(),this.setupLanguageListener(),document.body.appendChild(this.element)}createElement(){const e=document.createElement("div");return e.id="auth-modal",e.className="auth-modal hidden",e.innerHTML=this.getModalHTML(),e}getModalHTML(){const e=n.getTranslation();return`
      <div class="auth-modal-backdrop">
        <div class="auth-modal-content">
          <!-- Welcome Step -->
          <div class="auth-step" id="auth-step-welcome">
            <h2>${e.authWelcome}</h2>
            <p>${e.authSignInToPlay}</p>

            <div class="auth-buttons">
              <button id="auth-google" class="auth-button auth-button-google">
                <span>🔍</span> ${e.authContinueGoogle}
              </button>

              <button id="auth-email" class="auth-button auth-button-email">
                <span>📧</span> ${e.authContinueEmail}
              </button>
            </div>

            <button id="auth-close" class="auth-close-btn">×</button>
          </div>

          <!-- Email Step -->
          <div class="auth-step hidden" id="auth-step-email">
            <h2>${e.authEmailTitle}</h2>
            <p>${e.authEmailSubtitle}</p>

            <div class="auth-form">
              <input
                type="email"
                id="auth-email-input"
                placeholder="${e.authEmailPlaceholder}"
                class="auth-input"
              >
              <button id="auth-send-otp" class="auth-button auth-button-primary">
                ${e.authSendCode}
              </button>
              <button id="auth-back-welcome" class="auth-button auth-button-secondary">
                ${e.authBack}
              </button>
            </div>
          </div>

          <!-- Verify Step -->
          <div class="auth-step hidden" id="auth-step-verify">
            <h2>${e.authVerifyTitle}</h2>
            <p>${e.authVerifySubtitle}</p>

            <div class="auth-form">
              <input
                type="text"
                id="auth-otp-input"
                placeholder="${e.authOtpPlaceholder}"
                class="auth-input auth-input-otp"
                maxlength="6"
              >
              <button id="auth-verify-otp" class="auth-button auth-button-primary">
                ${e.authVerify}
              </button>
              <button id="auth-back-email" class="auth-button auth-button-secondary">
                ${e.authBack}
              </button>
            </div>
          </div>

          <!-- Profile Setup Step -->
          <div class="auth-step hidden" id="auth-step-profile">
            <h2>${e.authProfileTitle}</h2>
            <p>${e.authProfileSubtitle}</p>

            <div class="auth-form">
              <input
                type="text"
                id="auth-nickname-input"
                placeholder="${e.authNicknamePlaceholder}"
                class="auth-input"
                maxlength="20"
              >

              <div class="consent-checkbox">
                <label>
                  <input type="checkbox" id="marketing-consent" class="auth-checkbox">
                  ${e.authMarketingConsent}
                </label>
              </div>

              <button id="auth-complete" class="auth-button auth-button-primary">
                ${e.authStartPlaying}
              </button>
            </div>
          </div>

          <!-- Loading overlay -->
          <div class="auth-loading hidden" id="auth-loading">
            <div class="spinner"></div>
            <p>${e.authProcessing}</p>
          </div>
        </div>
      </div>
    `}setupEventListeners(){var e,t,a,i,s,o,c,d,m;(e=this.element.querySelector("#auth-close"))==null||e.addEventListener("click",()=>{this.hide()}),(t=this.element.querySelector("#auth-google"))==null||t.addEventListener("click",async()=>{await this.handleGoogleSignIn()}),(a=this.element.querySelector("#auth-email"))==null||a.addEventListener("click",()=>{this.showStep("email")}),(i=this.element.querySelector("#auth-send-otp"))==null||i.addEventListener("click",async()=>{await this.handleSendOTP()}),(s=this.element.querySelector("#auth-verify-otp"))==null||s.addEventListener("click",async()=>{await this.handleVerifyOTP()}),(o=this.element.querySelector("#auth-back-welcome"))==null||o.addEventListener("click",()=>{this.showStep("welcome")}),(c=this.element.querySelector("#auth-back-email"))==null||c.addEventListener("click",()=>{this.showStep("email")}),(d=this.element.querySelector("#auth-complete"))==null||d.addEventListener("click",async()=>{await this.handleCompleteProfile()}),(m=this.element.querySelector(".auth-modal-backdrop"))==null||m.addEventListener("click",h=>{h.target===h.currentTarget&&this.hide()}),this.element.addEventListener("keydown",h=>{h.key==="Escape"&&this.hide(),h.key==="Enter"&&this.handleEnterKey()})}setupLanguageListener(){n.onLanguageChange(()=>{this.element.innerHTML=this.getModalHTML(),this.setupEventListeners(),this.showStep(this.currentStep)})}async handleGoogleSignIn(){this.showLoading(!0);try{const e=await r.signInWithGoogle();if(e.success)console.log("Google sign in initiated");else{const t=n.getTranslation();this.showError(e.error||t.authGoogleFailed),this.showLoading(!1)}}catch(e){console.error("Google sign in error:",e);const t=n.getTranslation();this.showError(t.authUnexpectedError),this.showLoading(!1)}}async handleSendOTP(){const e=this.element.querySelector("#auth-email-input"),t=e==null?void 0:e.value.trim();if(!t||!t.includes("@")){const a=n.getTranslation();this.showError(a.authInvalidEmail);return}this.currentEmail=t,this.showLoading(!0);try{const a=await r.signInWithOTP(t);if(a.success){this.showStep("verify");const i=n.getTranslation();this.showSuccess(i.authCodeSent)}else{const i=n.getTranslation();this.showError(a.error||i.authSendFailed)}}catch(a){console.error("Send OTP error:",a);const i=n.getTranslation();this.showError(i.authUnexpectedError)}finally{this.showLoading(!1)}}async handleVerifyOTP(){var e;const t=this.element.querySelector("#auth-otp-input"),a=t==null?void 0:t.value.trim();if(!a||a.length!==6){const i=n.getTranslation();this.showError(i.authCodeLength);return}this.showLoading(!0);try{const i=await r.verifyOTP(this.currentEmail,a);if(i.success){await new Promise(o=>setTimeout(o,1e3));const s=r.getState();if(s.isAuthenticated)(e=s.profile)!=null&&e.nickname?this.completeAuth(!0):this.showStep("profile");else{const o=n.getTranslation();this.showError(o.authFailed)}}else{const s=n.getTranslation();this.showError(i.error||s.authInvalidCode)}}catch(i){console.error("Verify OTP error:",i);const s=n.getTranslation();this.showError(s.authVerifyFailed)}finally{this.showLoading(!1)}}async handleCompleteProfile(){const e=this.element.querySelector("#auth-nickname-input"),t=this.element.querySelector("#marketing-consent"),a=(e==null?void 0:e.value.trim())||null,i=(t==null?void 0:t.checked)||!1;this.showLoading(!0);try{await r.updateProfile({nickname:a,consent_marketing:i,consent_timestamp:i?new Date().toISOString():null}),this.completeAuth(!0)}catch(s){console.error("Profile update error:",s);const o=n.getTranslation();this.showError(o.authProfileFailed),this.showLoading(!1)}}showStep(e){this.element.querySelectorAll(".auth-step").forEach(a=>{a.classList.add("hidden")});const t=this.element.querySelector(`#auth-step-${e}`);if(t){t.classList.remove("hidden"),this.currentStep=e;const a=t.querySelector("input");a&&setTimeout(()=>a.focus(),100)}}showLoading(e){const t=this.element.querySelector("#auth-loading");t&&t.classList.toggle("hidden",!e)}showError(e){this.element.querySelectorAll(".auth-alert").forEach(i=>i.remove());const t=document.createElement("div");t.className="auth-alert auth-alert-error",t.textContent=e;const a=this.element.querySelector(".auth-step:not(.hidden)");a&&a.insertBefore(t,a.firstChild),setTimeout(()=>t.remove(),5e3)}showSuccess(e){this.element.querySelectorAll(".auth-alert").forEach(i=>i.remove());const t=document.createElement("div");t.className="auth-alert auth-alert-success",t.textContent=e;const a=this.element.querySelector(".auth-step:not(.hidden)");a&&a.insertBefore(t,a.firstChild),setTimeout(()=>t.remove(),3e3)}handleEnterKey(){var e,t,a;switch(this.currentStep){case"email":(e=this.element.querySelector("#auth-send-otp"))==null||e.dispatchEvent(new Event("click"));break;case"verify":(t=this.element.querySelector("#auth-verify-otp"))==null||t.dispatchEvent(new Event("click"));break;case"profile":(a=this.element.querySelector("#auth-complete"))==null||a.dispatchEvent(new Event("click"));break}}completeAuth(e){this.onAuthCallback&&this.onAuthCallback(e),this.hide()}show(){this.element.classList.remove("hidden"),this.showStep("welcome"),setTimeout(()=>{const e=this.element.querySelector(".auth-button");e==null||e.focus()},100)}hide(){this.element.classList.add("hidden")}onAuth(e){this.onAuthCallback=e}destroy(){this.element&&this.element.parentNode&&this.element.parentNode.removeChild(this.element)}}export{b as AuthModal};
//# sourceMappingURL=AuthModal-8f594c27-f8341862.js.map
