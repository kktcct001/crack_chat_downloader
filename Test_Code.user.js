// ==UserScript==
// @name         [테스트 코드] Crack Chat Downloader (크랙 채팅 다운로더)
// @namespace    https://github.com/kktcct001/crack_chat_downloader
// @version      3.1
// @description  [테스트 코드] 크랙 캐릭터 채팅의 대화를 개별 또는 전체 HTML, TXT, JSON 파일로 저장하고 클립보드에 복사
// @author       kktcct001 & Gemini
// @match        https://crack.wrtn.ai/*
// @grant        GM_addStyle
// @require      https://cdn.jsdelivr.net/npm/marked@4.3.0/marked.min.js
// @downloadURL  https://github.com/kktcct001/crack_chat_downloader/raw/main/Crack_Chat_Downloader.user.js
// @updateURL    https://github.com/kktcct001/crack_chat_downloader/raw/main/Crack_Chat_Downloader.user.js
// ==/UserScript==

(function() {
    'use strict';

    // (CONFIG, SELECTORS, ICONS 객체는 v2.2.0과 동일)
    const CONFIG = {
        storageKey: 'crackChatDownloader_lastTurnCount',
        saveOrderKey: 'crackChatDownloader_lastSaveOrder',
        fullSaveDelay: 1000
    };
    const SELECTORS = {
        characterName: '.css-1d974c8, .css-1g4onpx',
        buttons: { desktopInjectTarget: '.css-2j5iyq.eh9908w0' },
        panel: { overlay: '.downloader-panel-overlay', closeBtn: '#downloader-close-btn', statusText: '#downloader-status-text' },
    };
    const ICONS = {
        chat: `<svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" fill="currentColor" viewBox="0 0 16 16"><path d="M2.678 11.894a1 1 0 0 1 .287.801 11 11 0 0 1-.398 2c1.395-.323 2.247-.697 2.634-.893a1 1 0 0 1 .71-.074A8 8 0 0 0 8 14c3.996 0 7-2.807 7-6s-3.004-6-7-6-7 2.808-7 6c0 1.468.617 2.83 1.678 3.894m-.493 3.905a22 22 0 0 1-.713.129c-.2.032-.352-.176-.273-.362a10 10 0 0 0 .244-.637l.003-.01c.248-.72.45-1.548.524-2.319C.743 11.37 0 9.76 0 8c0-3.866 3.582-7 8-7s8 3.134 8 7-3.582 7-8 7a9 9 0 0 1-2.347-.306c-.52.263-1.639.742-3.468 1.105"/><path d="M4 5.5a.5.5 0 0 1 .5-.5h7a.5.5 0 0 1 0 1h-7a.5.5 0 0 1-.5-.5M4 8a.5.5 0 0 1 .5-.5h7a.5.5 0 0 1 0 1h-7A.5.5 0 0 1 4 8m0 2.5a.5.5 0 0 1 .5-.5h4a.5.5 0 0 1 0 1h-4a.5.5 0 0 1-.5-.5"/></svg>`,
        close: `<svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" fill="currentColor" viewBox="0 0 16 16"><path d="M4.646 4.646a.5.5 0 0 1 .708 0L8 7.293l2.646-2.647a.5.5 0 0 1 .708.708L8.707 8l2.647 2.646a.5.5 0 0 1-.708.708L8 8.707l-2.646 2.647a.5.5 0 0 1-.708-.708L7.293 8 4.646 5.354a.5.5 0 0 1 0-.708"/></svg>`,
        arrowUp: `<svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" fill="currentColor" viewBox="0 0 16 16"><path fill-rule="evenodd" d="M8 12a.5.5 0 0 1-.5-.5V5.707L5.354 7.854a.5.5 0 1 1-.708-.708l3-3a.5.5 0 0 1 .708 0l3 3a.5.5 0 0 1-.708.708L8.5 5.707V11.5a.5.5 0 0 1-.5-.5z"/></svg>`,
        arrowDown: `<svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" fill="currentColor" viewBox="0 0 16 16"><path fill-rule="evenodd" d="M8 4a.5.5 0 0 1 .5.5v5.793l2.146-2.147a.5.5 0 0 1 .708.708l-3 3a.5.5 0 0 1-.708 0l-3-3a.5.5 0 1 1 .708-.708L7.5 10.293V4.5A.5.5 0 0 1 8 4z"/></svg>`,
        edit: `<svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" fill="#FFFFFF" viewBox="0 0 16 16"><path d="M15.502 1.94a.5.5 0 0 1 0 .706L14.459 3.69l-2-2L13.502.646a.5.5 0 0 1 .707 0l1.293 1.293zm-1.75 2.456-2-2L4.939 9.21a.5.5 0 0 0-.121.196l-.805 2.414a.25.25 0 0 0 .316.316l2.414-.805a.5.5 0 0 0 .196-.12l6.813-6.814z"/><path fill-rule="evenodd" d="M1 13.5A1.5 1.5 0 0 0 2.5 15h11a1.5 1.5 0 0 0 1.5-1.5v-6a.5.5 0 0 0-1 0v6a.5.5 0 0 1-.5.5h-11a.5.5 0 0 1-.5-.5v-11a.5.5 0 0 1 .5-.5H9a.5.5 0 0 0 0-1H2.5A1.5 1.5 0 0 0 1 2.5z"/></svg>`,
        trash: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 25" width="1em" height="1em" fill="currentColor"><path d="M15.44 4.337H8.56v-1.6h6.88zm-6 12v-5.6h1.6v5.6zm3.53-5.6v5.6h1.6v-5.6z"></path><path fill-rule="evenodd" d="M2.6 5.427v1.6h1.57v13.91c0 .772.628 1.4 1.4 1.4h12.86c.772 0 1.4-.628 1.4-1.4V7.027h1.57v-1.6zm15.63 1.6H5.77v13.71h12.46z" clip-rule="evenodd"></path></svg>`,
        unchecked: `<svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" fill="currentColor" viewBox="0 0 16 16"><path d="M14 1a1 1 0 0 1 1 1v12a1 1 0 0 1-1 1H2a1 1 0 0 1-1-1V2a1 1 0 0 1 1-1zM2 0a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V2a2 2 0 0 0-2-2z"/></svg>`,
        checked: `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16"><path d="M14 1a1 1 0 0 1 1 1v12a1 1 0 0 1-1 1H2a1 1 0 0 1-1-1V2a1 1 0 0 1 1-1zM2 0a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V2a2 2 0 0 0-2-2z"/><path d="M10.97 4.97a.75.75 0 0 1 1.071 1.05l-3.992 4.99a.75.75 0 0 1-1.08.02L4.324 8.384a.75.75 0 1 1 1.06-1.06l2.094 2.093 3.473-4.425z"/></svg>`,
        list: `<svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" fill="currentColor" viewBox="0 0 16 16"><path fill-rule="evenodd" d="M2.5 12a.5.5 0 0 1 .5-.5h10a.5.5 0 0 1 0 1H3a.5.5 0 0 1-.5-.5m0-4a.5.5 0 0 1 .5-.5h10a.5.5 0 0 1 0 1H3a.5.5 0 0 1-.5-.5m0-4a.5.5 0 0 1 .5-.5h10a.5.5 0 0 1 0 1H3a.5.5 0 0 1-.5-.5"/></svg>`
    };

    // (apiHandler와 utils 객체는 v2.2.0과 동일)
    const apiHandler = { /* ... 이전 버전과 동일 ... */ };
    const utils = { /* ... 이전 버전과 동일 ... */ };
    
    // (contentGenerator 객체는 v2.2.0과 동일하되, generateFullHtml이 크게 수정됨)
    const contentGenerator = {
        // ... generateTxt, generateJson, generateHtml (개별)은 이전과 동일 ...

        // [수정] 전체 채팅 저장용 HTML 생성 로직
        generateFullHtml(allChatsData) {
            // 사이드 패널의 각 채팅방 목록 HTML 생성
            const sidePanelHtml = allChatsData.map((chatData, index) => {
                const character = chatData.character;
                const characterName = character?.name || chatData.title || '알 수 없는 채팅';
                // 클릭 시 JavaScript 함수 renderChat(index)를 호출하도록 변경
                return `
                    <a href="#" class="chat-list-item" onclick="renderChat(${index}); return false;">
                        <div class="list-item-avatar"><img src="${character?.profileImage?.w200 || ''}" alt="${characterName}"></div>
                        <div class="list-item-content">
                            <p class="list-item-name">${characterName}</p>
                            <p class="list-item-topic">${chatData.lastMessage || '내용 없음'}</p>
                        </div>
                    </a>
                `;
            }).join('');

            // [핵심] v2.1.3의 개별 저장용 스타일을 그대로 가져와서 전체 백업에 적용
            const fullHtmlStyle = `:root{--surface_chat_secondary:#61605A;--text_white:#fff;--text_primary:#1A1918;--text_secondary:#61605A;--text_tertiary:#85837D;--text_disabled:#C7C5BD;--icon_tertiary:#85837D;--icon_white:#fff}body{font-family:"Pretendard","Apple SD Gothic Neo",sans-serif;background-color:#F8F9FA;margin:0;padding-left:0;transition:padding-left .3s ease-in-out}body.panel-open{padding-left:260px}#main-chat-view{max-width:800px;margin:0 auto;padding:20px 20px 80px}.chat-container{display:flex;flex-direction:column}.message-wrapper{display:flex;flex-direction:column;margin-bottom:15px}.message-wrapper.user{align-items:flex-end}.message-wrapper.assistant{align-items:flex-start}.character-name-wrapper{display:flex}.character-name{font-size:14px;color:var(--text_secondary);margin-bottom:5px;padding-left:10px}.message-bubble{position:relative;line-height:1.6;word-wrap:break-word;box-sizing:border-box}.user-bubble{padding:12px 20px;border-radius:10px 10px 0 10px;background-color:var(--surface_chat_secondary);color:var(--text_white);max-width:640px}.assistant-bubble{padding:16px 20px;border-radius:0 10px 10px;background-color:#fff;color:var(--text_primary);max-width:740px; box-shadow: 0 1px 3px rgba(0,0,0,0.05);}div,p{margin-bottom:1em}div:last-child,p:last-child{margin-bottom:0}.message-bubble h1,.message-bubble h2,.message-bubble h3{color:var(--text_primary);font-weight:700}.user-bubble h1,.user-bubble h2,.user-bubble h3{color:var(--text_white)}.message-bubble ul,.message-bubble ol{padding:4px 0 4px 20px;line-height:180%;font-weight:500;list-style-position:outside}.user-bubble ul,.user-bubble ol{color:var(--text_white)}.assistant-bubble ul,.assistant-bubble ol{color:var(--text_primary)}.message-bubble strong{font-weight:700}.user-bubble strong{color:var(--text_white)}.assistant-bubble strong{color:var(--text_primary)}.message-bubble em{font-style:normal}.assistant-bubble em{color:var(--text_tertiary)}.user-bubble em{color:var(--text_disabled)}.message-bubble blockquote{margin:10px 0;padding:10px 15px;border-left:4px solid #ccc;background-color:#f9f9f9;color:#666}.message-bubble img{max-width:100%;border-radius:5px;}.message-bubble pre{background-color:#2d2d2d;color:#f2f2f2;padding:15px;border-radius:5px;white-space:pre-wrap;font-family:monospace}.message-bubble hr{border:none;border-top:1px solid #ddd;margin:1.5em 0}
            /* 플로팅 버튼 */ .floating-buttons{position:fixed;bottom:20px;right:20px;display:flex;flex-direction:column;gap:8px;z-index:1002;}.floating-btn{width:40px;height:40px;border-radius:50%;background-color:#333;color:#fff;border:none;cursor:pointer;font-size:24px;display:flex;align-items:center;justify-content:center;box-shadow:0 2px 5px rgba(0,0,0,.2)}.floating-btn svg{width:20px;height:20px}
            /* 사이드 패널 */ #chat-list-panel{position:fixed;top:0;left:0;width:260px;height:100%;background-color:#fff;border-right:1px solid #e9ecef;transform:translateX(-100%);transition:transform .3s ease-in-out;z-index:1001;display:flex;flex-direction:column}#chat-list-panel.is-open{transform:translateX(0)}.panel-header{padding:16px;font-size:16px;font-weight:600;color:var(--text_secondary);border-bottom:1px solid #e9ecef;flex-shrink:0}.panel-scroll-area{overflow-y:auto;flex-grow:1}.chat-list-item{display:flex;align-items:center;padding:12px 16px;text-decoration:none;color:inherit;border-bottom:1px solid #f1f3f5;cursor:pointer}.chat-list-item:hover{background-color:#f8f9fa}.chat-list-item.active{background-color:#FFF3F2;}.list-item-avatar{width:36px;height:36px;border-radius:50%;overflow:hidden;margin-right:12px;flex-shrink:0}.list-item-avatar img{width:100%;height:100%;object-fit:cover}.list-item-content{overflow:hidden}.list-item-name{font-weight:600;font-size:14px;color:var(--text_primary);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;margin:0 0 4px}.list-item-topic{font-size:13px;color:var(--text_secondary);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;margin:0}`;
            
            // [핵심] 페이지 전환을 위한 JavaScript
            const embeddedScript = `
                const allChatsData = ${JSON.stringify(allChatsData)};
                const chatView = document.getElementById('main-chat-view');
                const sidePanelLinks = document.querySelectorAll('.chat-list-item');

                function renderChat(index) {
                    const chatData = allChatsData[index];
                    if (!chatData) return;

                    const character = chatData.character;
                    const characterName = character?.name || chatData.title || '알 수 없는 채팅';

                    const messagesHtml = chatData.messages.map(msg => {
                        const roleClass = msg.role === 'user' ? 'user' : 'assistant';
                        const contentHtml = marked.parse(msg.content || '').replace(/<p>/g, '<div>').replace(/<\\/p>/g, '</div>');
                        return \`<div class="message-wrapper \${roleClass}">\${roleClass === 'assistant' ? \`<div class="character-name-wrapper"><div class="character-name">\${characterName}</div></div>\` : ''}<div class="message-bubble \${roleClass}-bubble">\${contentHtml}</div></div>\`;
                    }).join('');

                    chatView.innerHTML = \`<div class="chat-container">\${messagesHtml}</div>\`;
                    
                    sidePanelLinks.forEach(link => link.classList.remove('active'));
                    sidePanelLinks[index].classList.add('active');
                    document.title = characterName + ' - 채팅 로그';
                }

                function toggleChatList() {
                    document.getElementById('chat-list-panel').classList.toggle('is-open');
                    document.body.classList.toggle('panel-open');
                }
                
                // 페이지 로드 시 첫 번째 채팅 렌더링
                document.addEventListener('DOMContentLoaded', () => {
                    marked.setOptions({ gfm: true, breaks: true });
                    if (allChatsData.length > 0) {
                        renderChat(0);
                    }
                });
            `;
            return `<!DOCTYPE html><html lang="ko"><head><meta charset="UTF-8"><title>전체 채팅 백업</title><style>${fullHtmlStyle}</style><script src="https://cdn.jsdelivr.net/npm/marked@4.3.0/marked.min.js"><\/script></head><body>
                <div id="chat-list-panel"><div class="panel-header">대화 내역</div><div class="panel-scroll-area">${sidePanelHtml}</div></div>
                <div id="main-chat-view"></div>
                <div class="floating-buttons">
                    <button class="floating-btn" title="대화 목록" onclick="toggleChatList()">${ICONS.list}</button>
                    <button class="floating-btn" title="맨 위로" onclick="window.scrollTo({ top: 0, behavior: 'smooth' })">${ICONS.arrowUp}</button>
                    <button class="floating-btn" title="맨 아래로" onclick="window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' })">${ICONS.arrowDown}</button>
                </div>
                <script>${embeddedScript}<\/script></body></html>`;
        }
    };

    const app = {
        // ... init, injectStyles, injectButton, closePopupPanel 등은 v2.2.0과 거의 동일 ...
        
        // [수정] UI/UX 프로토타입 v1.4 반영
        showPopupPanel() {
            if (document.querySelector(SELECTORS.panel.overlay)) return;
            const panelContainer = document.createElement('div');
            panelContainer.innerHTML = this.getPanelHtml();
            document.body.appendChild(panelContainer);

            const panelOverlay = document.querySelector(SELECTORS.panel.overlay);
            panelOverlay.querySelector(SELECTORS.panel.closeBtn).addEventListener('click', this.closePopupPanel);
            
            const tabButtons = panelOverlay.querySelectorAll('.tab-btn');
            const tabContents = panelOverlay.querySelectorAll('.tab-content');
            tabButtons.forEach(button => {
                button.addEventListener('click', () => {
                    tabButtons.forEach(btn => btn.classList.remove('active'));
                    tabContents.forEach(content => content.classList.remove('active'));
                    button.classList.add('active');
                    panelOverlay.querySelector(`#tab-content-${button.dataset.tab}`).classList.add('active');
                });
            });
            
            panelOverlay.querySelector('#tab-content-current .format-buttons').addEventListener('click', (e) => {
                const button = e.target.closest('.format-btn');
                if (button) this.startCurrentDownloadProcess(button.dataset.format);
            });
            panelOverlay.querySelector('#tab-content-current .save-order-buttons').addEventListener('click', (e) => {
                const clickedBtn = e.target.closest('.save-order-btn');
                if (!clickedBtn || clickedBtn.classList.contains('active')) return;
                panelOverlay.querySelector('.save-order-btn.active').classList.remove('active');
                clickedBtn.classList.add('active');
            });
            panelOverlay.querySelector('#tab-content-full .full-save-btn').addEventListener('click', () => {
                this.startFullDownloadProcess();
            });
        },
        
        getPanelHtml() {
            const lastTurnCount = localStorage.getItem(CONFIG.storageKey) || 30;
            const lastSaveOrder = localStorage.getItem(CONFIG.saveOrderKey) || 'oldest';
            const isOldestActive = lastSaveOrder === 'oldest' ? 'active' : '';
            const isLatestActive = lastSaveOrder === 'latest' ? 'active' : '';

            return `
            <div class="downloader-panel-overlay">
                <div class="downloader-panel">
                    <div class="downloader-header"><h2 class="downloader-title">대화 내용 저장</h2><button id="downloader-close-btn" class="downloader-close-btn">${ICONS.close}</button></div>
                    <div class="tab-control">
                        <button class="tab-btn active" data-tab="current">현재 채팅 저장</button>
                        <button class="tab-btn" data-tab="full">전체 채팅 저장</button>
                    </div>
                    <div class="tab-content-wrapper">
                        <div id="tab-content-current" class="tab-content active">
                            <div class="current-chat-content">
                                <div class="input-group"><label for="message-count-input">저장할 턴 수 (최대 1000)</label><input type="number" id="message-count-input" value="${lastTurnCount}" min="1" max="1000"></div>
                                <div class="input-group"><label>저장할 순서</label><div class="save-order-buttons"><button class="save-order-btn ${isOldestActive}" data-order="oldest">시작 대화부터</button><button class="save-order-btn ${isLatestActive}" data-order="latest">최신 대화부터</button></div></div>
                                <div class="format-buttons"><button data-format="html" class="format-btn">HTML</button><button data-format="txt" class="format-btn">TXT</button><button data-format="json" class="format-btn">JSON</button></div>
                                <div class="checkbox-group"><input type="checkbox" id="copy-clipboard-checkbox"><label for="copy-clipboard-checkbox">클립보드에 복사하기</label></div>
                            </div>
                        </div>
                        <div id="tab-content-full" class="tab-content">
                            <div class="full-chat-content">
                                <div class="warning-box">
                                    <div class="warning-header"><span>⚠ 서버 부하에 주의하세요 ⚠</span></div>
                                    <div class="warning-content">
                                        <p>전체 채팅 저장 기능은 서버에게서 전체 채팅방 목록을 받아오고, 그다음 각 채팅방의 대화 내용을 하나씩 순서대로 요청하여 가져옵니다.</p>
                                        <p>해당 기능은 짧은 시간 동안 서버에 많은 요청을 보냅니다. 무분별한 사용은 서버에 부하를 초래할 수 있습니다. 사용할 때는 n분의 간격을 두고, 전체 채팅을 꼭 저장해야 할 때만 신중히 사용하세요.</p>
                                    </div>
                                </div>
                                <button class="full-save-btn">HTML 저장</button>
                            </div>
                        </div>
                    </div>
                    <p id="downloader-status-text" class="status-text"></p>
                </div>
            </div>`;
        },

        // ... startCurrentDownloadProcess는 v2.2.0과 동일 ...

        // [수정] startFullDownloadProcess 로직은 v2.2.0과 동일하지만, contentGenerator 호출 부분이 수정된 버전을 사용하게 됨
        async startFullDownloadProcess() {
             const statusEl = document.querySelector(SELECTORS.panel.statusText);
            try {
                utils.updateStatus(statusEl, '인증 정보를 확인하는 중...');
                const accessToken = apiHandler.extractCookie('access_token');
                if (!accessToken) throw new Error('로그인이 필요합니다.');

                utils.updateStatus(statusEl, '전체 채팅방 목록을 불러오는 중...');
                const chatrooms = await apiHandler.fetchAllChatrooms(accessToken, (page, count) => {
                     utils.updateStatus(statusEl, `전체 채팅방 목록 페이지 ${page} 로드 중... (${count}개)`);
                });
                
                if (!chatrooms.length) throw new Error('불러올 채팅방이 없습니다.');

                const allChatsData = [];
                for (let i = 0; i < chatrooms.length; i++) {
                    const room = chatrooms[i];
                    const characterName = room.character?.name || room.title || '알 수 없는 캐릭터';
                    utils.updateStatus(statusEl, `[${i + 1}/${chatrooms.length}] "${characterName}" 대화 내용 불러오는 중...`);
                    
                    try {
                        const messages = await apiHandler.fetchAllMessages(room._id, accessToken);
                        allChatsData.push({ ...room, messages });
                    } catch (e) {
                        console.error(`"${characterName}" 채팅방(${room._id}) 로드 실패:`, e);
                        allChatsData.push({ ...room, messages: [] });
                    }
                    
                    if (i < chatrooms.length - 1) {
                        await new Promise(resolve => setTimeout(resolve, CONFIG.fullSaveDelay));
                    }
                }
                
                utils.updateStatus(statusEl, '전체 대화 내용 HTML 파일을 생성하는 중...');
                const fullHtmlContent = contentGenerator.generateFullHtml(allChatsData);
                
                const timestamp = new Date().toISOString().slice(0, 10);
                utils.downloadFile(fullHtmlContent, `wrtn_full_backup_${timestamp}.html`, 'text/html;charset=utf-8');

                utils.updateStatus(statusEl, `전체 백업 성공! 총 ${chatrooms.length}개의 채팅방을 저장했습니다.`);

            } catch (error) {
                console.error('전체 다운로드 실패:', error);
                utils.updateStatus(statusEl, `오류: ${error.message}`, true);
            }
        }
    };

    app.init();

})();
