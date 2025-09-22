import{u as c,e as h,y}from"./index-e955accf.js";import"./supabase-cf010ec4.js";var v=Object.defineProperty,p=(i,e,a)=>e in i?v(i,e,{enumerable:!0,configurable:!0,writable:!0,value:a}):i[e]=a,b=(i,e,a)=>(p(i,typeof e!="symbol"?e+"":e,a),a);class k{constructor(){b(this,"modal",null),b(this,"currentView","weekly"),b(this,"isLoading",!1),this.createModal(),this.setupEventListeners()}createModal(){this.modal=document.createElement("div"),this.modal.id="leaderboard-modal",this.modal.className="leaderboard-modal",this.modal.style.display="none",this.modal.innerHTML=`
      <div class="leaderboard-modal-backdrop"></div>
      <div class="leaderboard-modal-content">
        <button class="leaderboard-close-btn" id="leaderboard-close">&times;</button>

        <div class="leaderboard-header">
          <h2 class="leaderboard-title" data-i18n="leaderboardTitle">🏆 Classifica</h2>
          <div class="leaderboard-tabs">
            <button class="leaderboard-tab active" data-tab="weekly" data-i18n="leaderboardWeekly">
              📅 Settimanale
            </button>
            <button class="leaderboard-tab" data-tab="monthly" data-i18n="leaderboardMonthly">
              📆 Mensile
            </button>
          </div>
        </div>

        <div class="leaderboard-content">
          <div class="leaderboard-loading" id="leaderboard-loading">
            <div class="spinner"></div>
            <p data-i18n="leaderboardLoading">Caricamento classifica...</p>
          </div>

          <div class="leaderboard-list" id="leaderboard-list">
            <!-- Dynamic content -->
          </div>

          <div class="leaderboard-empty" id="leaderboard-empty" style="display: none">
            <p data-i18n="leaderboardEmpty">Nessun punteggio ancora registrato!</p>
            <p class="leaderboard-encourage" data-i18n="leaderboardEncourage">
              Sii il primo a giocare e stabilire il record!
            </p>
          </div>
        </div>

        <div class="leaderboard-footer">
          <p class="leaderboard-info" data-i18n="leaderboardInfo">
            💡 Accedi per competere per i premi settimanali e mensili!
          </p>
        </div>
      </div>
    `,document.body.appendChild(this.modal)}setupEventListeners(){var e,a,d;const r=(e=this.modal)==null?void 0:e.querySelector("#leaderboard-close");r==null||r.addEventListener("click",()=>this.hide());const s=(a=this.modal)==null?void 0:a.querySelector(".leaderboard-modal-backdrop");s==null||s.addEventListener("click",()=>this.hide());const t=(d=this.modal)==null?void 0:d.querySelectorAll(".leaderboard-tab");t==null||t.forEach(l=>{l.addEventListener("click",o=>{const n=o.target.getAttribute("data-tab");this.switchTab(n)})}),c.onLanguageChange(()=>{this.updateTranslations()}),document.addEventListener("keydown",l=>{var o;l.key==="Escape"&&((o=this.modal)==null?void 0:o.style.display)!=="none"&&this.hide()})}updateTranslations(){if(!this.modal)return;const e=c.getTranslation();this.modal.querySelectorAll("[data-i18n]").forEach(a=>{const d=a.getAttribute("data-i18n");d&&d in e&&(a.textContent=e[d])})}switchTab(e){var a;if(this.currentView===e||this.isLoading)return;this.currentView=e;const d=(a=this.modal)==null?void 0:a.querySelectorAll(".leaderboard-tab");d==null||d.forEach(r=>{r.classList.remove("active"),r.getAttribute("data-tab")===e&&r.classList.add("active")}),this.loadLeaderboard()}async loadLeaderboard(){if(!(!this.modal||this.isLoading)){this.isLoading=!0,this.showLoading();try{console.log(`🏆 Loading ${this.currentView} leaderboard...`);let e=[];this.currentView==="weekly"?e=await this.getWeeklyLeaderboard():e=await this.getMonthlyLeaderboard(),this.renderLeaderboard(e)}catch(e){console.error("Error loading leaderboard:",e),this.showError()}finally{this.isLoading=!1,this.hideLoading()}}}async getWeeklyLeaderboard(){console.log("📞 Calling scoreService.getWeeklyLeaderboard(50)...");try{const e=await h.getWeeklyLeaderboard(50);return console.log("✅ scoreService.getWeeklyLeaderboard completed with:",e==null?void 0:e.length,"entries"),e.map(a=>({id:a.id,score:a.score,run_seconds:a.run_seconds,created_at:a.created_at,nickname:a.nickname||"Anonimo",user_id:a.user_id}))}catch(e){throw console.error("❌ scoreService.getWeeklyLeaderboard failed:",e),e}}async getMonthlyLeaderboard(){return(await h.getMonthlyLeaderboard(50)).map(e=>({id:e.id,score:e.score,run_seconds:e.run_seconds,created_at:e.created_at,nickname:e.nickname||"Anonimo",user_id:e.user_id}))}renderLeaderboard(e){var a;if(!this.modal)return;const d=this.modal.querySelector("#leaderboard-list"),r=this.modal.querySelector("#leaderboard-empty");if(e.length===0){d.style.display="none",r.style.display="block";return}r.style.display="none",d.style.display="block";const s=(a=y.getState().user)==null?void 0:a.id;d.innerHTML=e.map((t,l)=>{const o=l+1,n=s===t.user_id,u=o<=3?this.getMedal(o):`${o}.`,m=new Date(t.created_at).toLocaleDateString(c.getCurrentLanguage()==="it"?"it-IT":"en-US",{month:"short",day:"numeric",hour:"2-digit",minute:"2-digit"});return`
        <div class="leaderboard-entry ${n?"current-user":""}">
          <div class="leaderboard-position">${u}</div>
          <div class="leaderboard-player">
            <div class="leaderboard-nickname">${t.nickname}</div>
            <div class="leaderboard-date">${m}</div>
          </div>
          <div class="leaderboard-score">
            <div class="score-value">${t.score}</div>
            <div class="score-time">${t.run_seconds}s</div>
          </div>
        </div>
      `}).join("")}getMedal(e){switch(e){case 1:return"🥇";case 2:return"🥈";case 3:return"🥉";default:return`${e}.`}}showLoading(){if(!this.modal)return;const e=this.modal.querySelector("#leaderboard-loading"),a=this.modal.querySelector("#leaderboard-list"),d=this.modal.querySelector("#leaderboard-empty");e.style.display="flex",a.style.display="none",d.style.display="none"}hideLoading(){if(!this.modal)return;const e=this.modal.querySelector("#leaderboard-loading");e.style.display="none"}showError(){if(!this.modal)return;const e=this.modal.querySelector("#leaderboard-list");e.innerHTML=`
      <div class="leaderboard-error">
        <p>❌ Errore nel caricamento della classifica</p>
        <button onclick="location.reload()" class="retry-btn">🔄 Riprova</button>
      </div>
    `,e.style.display="block"}show(){this.modal&&(this.modal.style.display="flex",this.updateTranslations(),this.loadLeaderboard(),console.log("🏆 Leaderboard modal opened"))}hide(){this.modal&&(this.modal.style.display="none",console.log("🏆 Leaderboard modal closed"))}destroy(){this.modal&&(this.modal.remove(),this.modal=null)}}export{k as LeaderboardModal};
//# sourceMappingURL=LeaderboardModal-1941094b-76d6cbda.js.map
