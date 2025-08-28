// ==UserScript==
// @name         [Test_code] Crack Chat Downloader
// @namespace    https://github.com/kktcct001/crack_chat_downloader
// @version      2.3.5
// @description  [테스트 코드] 크랙 캐릭터 채팅의 대화를 HTML, TXT, JSON 파일로 저장하고 클립보드에 복사
// @author       kktcct001
// @match        https://crack.wrtn.ai/*
// @grant        GM_addStyle
// @require      https://cdn.jsdelivr.net/npm/marked@4.3.0/marked.min.js
// @downloadURL  https://github.com/kktcct001/crack_chat_downloader/raw/refs/heads/main/Test_Code.user.js
// @updateURL    https://github.com/kktcct001/crack_chat_downloader/raw/refs/heads/main/Test_Code.user.js
// ==/UserScript==

(function() {
    'use strict';

    const CONFIG = {
        storageKey: 'crackChatDownloader_lastTurnCount'
    };

    const SELECTORS = {
        characterName: '.css-1d974c8, .css-1g4onpx',
        buttons: {
            desktopInjectTarget: '.css-2j5iyq.eh9908w0',
        },
        panel: {
            overlay: '.downloader-panel-overlay',
            closeBtn: '#downloader-close-btn',
            formatBtns: '.format-buttons',
            formatBtn: '.format-btn',
            countInput: '#message-count-input',
            saveOrderBtns: '.save-order-buttons',
            saveOrderBtn: '.save-order-btn',
            clipboardCheckbox: '#copy-clipboard-checkbox',
            statusText: '#downloader-status-text',
        },
    };

    const ICONS = {
        chat: `<svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" fill="currentColor" viewBox="0 0 16 16"><path d="M2.678 11.894a1 1 0 0 1 .287.801 11 11 0 0 1-.398 2c1.395-.323 2.247-.697 2.634-.893a1 1 0 0 1 .71-.074A8 8 0 0 0 8 14c3.996 0 7-2.807 7-6s-3.004-6-7-6-7 2.808-7 6c0 1.468.617 2.83 1.678 3.894m-.493 3.905a22 22 0 0 1-.713.129c-.2.032-.352-.176-.273-.362a10 10 0 0 0 .244-.637l.003-.01c.248-.72.45-1.548.524-2.319C.743 11.37 0 9.76 0 8c0-3.866 3.582-7 8-7s8 3.134 8 7-3.582 7-8 7a9 9 0 0 1-2.347-.306c-.52.263-1.639.742-3.468 1.105"/><path d="M4 5.5a.5.5 0 0 1 .5-.5h7a.5.5 0 0 1 0 1h-7a.5.5 0 0 1-.5-.5M4 8a.5.5 0 0 1 .5-.5h7a.5.5 0 0 1 0 1h-7A.5.5 0 0 1 4 8m0 2.5a.5.5 0 0 1 .5-.5h4a.5.5 0 0 1 0 1h-4a.5.5 0 0 1-.5-.5"/></svg>`,
        close: `<svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" fill="currentColor" viewBox="0 0 16 16"><path d="M4.646 4.646a.5.5 0 0 1 .708 0L8 7.293l2.646-2.647a.5.5 0 0 1 .708.708L8.707 8l2.647 2.646a.5.5 0 0 1-.708.708L8 8.707l-2.646 2.647a.5.5 0 0 1-.708-.708L7.293 8 4.646 5.354a.5.5 0 0 1 0-.708"/></svg>`,
    };

    const apiHandler = {
        apiUrl: 'https://contents-api.wrtn.ai',
        extractCookie(key) {
            const match = document.cookie.match(new RegExp(`(?:^|; )${key.replace(/([.$?*|{}()[\]\\/+^])/g, '\\$1')}=([^;]*)`));
            return match ? decodeURIComponent(match[1]) : null;
        },
        getChatInfo() {
            const match = location.pathname.match(/\/u\/([a-f0-9]+)\/c\/([a-f0-9]+)/);
            return match ? { characterId: match[1], chatroomId: match[2] } : null;
        },
        async fetchAllMessages(chatroomId) {
            const accessToken = this.extractCookie('access_token');
            if (!accessToken) throw new Error('로그인이 필요합니다.');
            const url = `${this.apiUrl}/character-chat/api/v2/chat-room/${chatroomId}/messages?limit=2000`;
            const response = await fetch(url, { headers: { 'Authorization': `Bearer ${accessToken}` } });
            if (!response.ok) throw new Error(`서버 통신 오류: ${response.status}`);
            const data = await response.json();
            return (data.data.list || []);
        }
    };

    const contentGenerator = {
        generateTxt(messages) {
            return messages.map(msg => `[${msg.role} message]\n${msg.content}`).join('\n\n===\n\n');
        },
        generateJson(messages) {
            const filtered = messages.map(msg => ({ role: msg.role, content: msg.content }));
            return JSON.stringify(filtered, null, 2);
        },
        generateHtml(messages, characterName) {
            const renderer = new marked.Renderer();
            renderer.heading = (text, level) => `<h${level}>${text}</h${level}>`;
            renderer.strong = (text) => `<strong>${text}</strong>`;
            renderer.em = (text) => `<em>${text}</em>`;
            renderer.list = (body, ordered) => `<${ordered ? 'ol' : 'ul'}>${body}</${ordered ? 'ol' : 'ul'}>`;
            renderer.listitem = (text) => `<li>${text}</li>`;
            renderer.blockquote = (quote) => `<blockquote>${quote}</blockquote>`;
            renderer.hr = () => '<hr>';
            renderer.image = (href, title, text) => `<div><img src="${href}" alt="${text}"></div>`;
            renderer.code = (code) => `<pre><code>${code.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</code></pre>`;
            delete renderer.paragraph;
            marked.setOptions({ renderer, gfm: true, breaks: true });

            const messageHtml = messages.map(msg => {
                let contentHtml = marked.parse(msg.content || '');
                contentHtml = contentHtml.replace(/<p>/g, `<div>`).replace(/<\/p>/g, '</div>');
                const roleClass = msg.role === 'user' ? 'user' : 'assistant';
                return `<div class="message-wrapper ${roleClass}">${msg.role === 'assistant' ? `<div class="character-name-wrapper"><div class="character-name">${characterName}</div></div>` : ''}<div class="message-bubble ${roleClass}-bubble">${contentHtml}</div></div>`;
            }).join('');

            const fullHtmlStyle = `body{font-family:"Pretendard","Apple SD Gothic Neo",sans-serif;background-color:#fff;margin:0;padding:0}.chat-container{max-width:800px;margin:0 auto;padding:20px;display:flex;flex-direction:column}.message-wrapper{display:flex;flex-direction:column;margin-bottom:15px}.message-wrapper.user{align-items:flex-end}.message-wrapper.assistant{align-items:flex-start}.character-name-wrapper{display:flex}.character-name{font-size:14px;color:#61605A;margin-bottom:5px;padding-left:10px}.message-bubble{position:relative;padding:16px 20px;line-height:1.6;word-wrap:break-word;box-sizing:border-box}.user-bubble{border-radius:10px 10px 0 10px;background-color:#61605A;color:#fff;max-width:640px}.assistant-bubble{border-radius:0 10px 10px;background-color:#F0EFEB;color:#1A1918;max-width:740px}div,p{margin-bottom:1em}div:last-child,p:last-child{margin-bottom:0}`;
            const fullHtml = `<!DOCTYPE html><html lang="ko"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><title>${characterName} Chat Log</title><style>${fullHtmlStyle}</style></head><body><div class="chat-container">${messageHtml}</div></body></html>`;
            return fullHtml;
        }
    };

    const utils = {
        downloadFile(content, fileName, mimeType) {
            const a = document.createElement('a');
            const blob = new Blob([content], { type: mimeType });
            a.href = URL.createObjectURL(blob);
            a.download = fileName;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(a.href);
        },
        async copyToClipboard(text, statusEl, successMsg) {
            try {
                await navigator.clipboard.writeText(text);
                statusEl.textContent = `${successMsg} 클립보드에 복사되었습니다.`;
            } catch (err) {
                statusEl.textContent = '클립보드 복사에 실패했습니다.';
                console.error('Clipboard copy failed:', err);
            }
        },
        updateStatus(statusEl, message, isError = false) {
            statusEl.textContent = message;
            statusEl.style.color = isError ? '#FF4432' : '#85837D';
        }
    };

    const app = {
        init() {
            this.injectStyles();
            const injectionInterval = setInterval(() => {
                if (this.injectButton()) {
                    clearInterval(injectionInterval);
                }
            }, 500);
        },

        injectStyles() {
            GM_addStyle(`
                .chat-log-downloader-btn-desktop { display:flex; align-items:center; justify-content:center; height:34px; padding:0 12px; margin:0 8px; border-radius:8px; cursor:pointer; font-size:14px; font-weight:600; color:#FF4432; background-color:#fff; border:1px solid #FF4432; white-space:nowrap; gap:6px; }
                .chat-log-downloader-btn-desktop .icon-box { display:flex; justify-content:center; align-items:center; width:16px; height:16px; background-color:transparent; }
                .chat-log-downloader-btn-desktop svg { font-size:16px; color:#FF4432; }
                .chat-log-downloader-btn-mobile { display:flex; align-items:center; justify-content:center; height:48px; padding:0 12px; margin:16px; border-radius:8px; cursor:pointer; font-size:16px; font-weight:600; color:#FF4432; background-color:#fff; border:1px solid #FF4432; white-space:nowrap; gap:8px; margin-top:auto; }
                .chat-log-downloader-btn-mobile .icon-box { display:flex; justify-content:center; align-items:center; }
                .chat-log-downloader-btn-mobile svg { font-size:20px; color:#FF4432; }
                .downloader-panel-overlay { position:fixed; top:0; left:0; width:100%; height:100%; background-color:rgba(0,0,0,.6); display:flex; justify-content:center; align-items:center; z-index:9999; }
                .downloader-panel { background-color:#fff; padding:28px; border-radius:12px; width:400px; min-height:394px; box-sizing:border-box; box-shadow:0 4px 12px rgba(0,0,0,.15); font-family:Pretendard,sans-serif; color:#1A1918; display:flex; flex-direction:column; }
                @media (max-width:768px) {
                    .downloader-panel { width:90%; }
                    .css-uxwch2 { overflow-y: auto !important; }
                }
                .downloader-header { display:flex; justify-content:space-between; align-items:center; margin-bottom:24px; }
                .downloader-title { margin:0; font-size:22px; font-weight:700; }
                .downloader-close-btn { background:0 0; border:none; cursor:pointer; padding:0; font-size:28px; color:#333; line-height:1; }
                .downloader-content { flex:1; display:flex; flex-direction:column; justify-content:space-between; }
                .input-group { margin-bottom:16px; }
                .downloader-panel label { display:block; margin-bottom:8px; font-weight:600; font-size:14px; color:#666; }
                .downloader-panel input[type=number] { width:100%; padding:14px; border:none; border-radius:8px; font-size:16px; box-sizing:border-box; background-color:#F0F0F0; }
                .save-order-buttons { display:flex; gap:8px; }
                .save-order-btn { flex:1; padding:12px; border-radius:8px; border:none; font-size:14px; font-weight:600; cursor:pointer; transition:background-color .2s; background-color:#F0F0F0; color:#333; }
                .save-order-btn.active { background-color:#FF4432; color:#fff; }
                .save-order-btn:not(.active):hover { background-color:#E0E0E0; }
                .format-buttons { display:flex; gap:10px; margin-bottom:20px; }
                .format-btn { flex:1; padding:14px; border-radius:8px; border:1px solid #FF4432; font-size:16px; font-weight:700; cursor:pointer; background-color:#FF4432; color:#fff; }
                .checkbox-group { display:flex; align-items:center; justify-content:center; gap:8px; margin-top:20px; }
                .checkbox-group label { margin:0; font-size:14px; color:#333; }
                .status-text { margin-top:auto; padding-top:15px; text-align:center; min-height:38px; height:38px; box-sizing:border-box; display:flex; align-items:center; justify-content:center; color:#85837D; font-size:13px; }
            `);
        },

        findMobileInjectTarget() {
            const menuListContainer = document.querySelector('.css-uxwch2');
            if (menuListContainer) {
                const sideMenuPanel = menuListContainer.closest('div[class*="eh9908w0"]');
                if (sideMenuPanel) return sideMenuPanel;
            }
            return document.querySelector('div[class*="eh9908w0"]');
        },

        injectButton() {
            if (document.querySelector('.chat-log-downloader-btn-desktop, .chat-log-downloader-btn-mobile')) return true;

            const isMobile = window.matchMedia("(max-width: 768px)").matches;
            let target = null;

            if (isMobile) {
                target = this.findMobileInjectTarget();
            } else {
                target = document.querySelector(SELECTORS.buttons.desktopInjectTarget);
            }

            if (!target) return false;

            const buttonClass = isMobile ? 'chat-log-downloader-btn-mobile' : 'chat-log-downloader-btn-desktop';
            const saveButton = document.createElement('button');
            saveButton.className = buttonClass;
            saveButton.innerHTML = `<span class="icon-box">${ICONS.chat}</span><span>대화 내용 저장</span>`;
            saveButton.addEventListener('click', () => this.showPopupPanel());

            if (isMobile) {
                target.appendChild(saveButton);
            } else {
                target.parentElement.parentElement.insertBefore(saveButton, target.parentElement);
            }
            return true;
        },

        showPopupPanel() {
            if (document.querySelector(SELECTORS.panel.overlay)) return;

            const lastTurnCount = localStorage.getItem(CONFIG.storageKey) || 30;
            const panelOverlay = document.createElement('div');
            panelOverlay.className = 'downloader-panel-overlay';
            panelOverlay.innerHTML = `<div class="downloader-panel"><div class="downloader-header"><h2 class="downloader-title">대화 저장 설정</h2><button id="downloader-close-btn" class="downloader-close-btn">${ICONS.close}</button></div><div class="downloader-content"><div><div class="input-group"><label for="message-count-input">저장할 턴 수 (최대 1000)</label><input type="number" id="message-count-input" value="${lastTurnCount}" min="1" max="1000"></div><div class="input-group"><label>저장할 순서</label><div class="save-order-buttons"><button class="save-order-btn active" data-order="oldest">시작 대화부터</button><button class="save-order-btn" data-order="latest">최신 대화부터</button></div></div><div class="format-buttons"><button data-format="html" class="format-btn">HTML</button><button data-format="txt" class="format-btn">TXT</button><button data-format="json" class="format-btn">JSON</button></div><div class="checkbox-group"><input type="checkbox" id="copy-clipboard-checkbox"><label for="copy-clipboard-checkbox">클립보드에 복사하기</label></div></div><p id="downloader-status-text" class="status-text"></p></div></div>`;
            document.body.appendChild(panelOverlay);

            panelOverlay.querySelector(SELECTORS.panel.closeBtn).addEventListener('click', this.closePopupPanel);
            
            panelOverlay.querySelector(SELECTORS.panel.saveOrderBtns).addEventListener('click', (e) => {
                const clickedBtn = e.target.closest(SELECTORS.panel.saveOrderBtn);
                if (!clickedBtn || clickedBtn.classList.contains('active')) return;
                panelOverlay.querySelector(`${SELECTORS.panel.saveOrderBtn}.active`).classList.remove('active');
                clickedBtn.classList.add('active');
            });

            panelOverlay.querySelector(SELECTORS.panel.formatBtns).addEventListener('click', (e) => {
                const button = e.target.closest(SELECTORS.panel.formatBtn);
                if (button && button.dataset.format) {
                    this.startDownloadProcess(button.dataset.format);
                }
            });
        },

        closePopupPanel() {
            const panel = document.querySelector(SELECTORS.panel.overlay);
            if (panel) panel.remove();
        },

        async startDownloadProcess(format) {
            const statusEl = document.querySelector(SELECTORS.panel.statusText);
            try {
                const turnCount = parseInt(document.querySelector(SELECTORS.panel.countInput).value, 10);
                const saveOrder = document.querySelector(`${SELECTORS.panel.saveOrderBtn}.active`).dataset.order;
                const shouldCopy = document.querySelector(SELECTORS.panel.clipboardCheckbox).checked;

                if (isNaN(turnCount) || turnCount <= 0 || turnCount > 1000) {
                    throw new Error('저장할 턴 수는 1에서 1000 사이의 숫자여야 합니다.');
                }

                utils.updateStatus(statusEl, '채팅방 정보를 확인하는 중...');
                const chatInfo = apiHandler.getChatInfo();
                if (!chatInfo) throw new Error('채팅방 정보를 찾을 수 없습니다.');
                utils.updateStatus(statusEl, '대화 기록을 불러오는 중...');
                const allMessages = await apiHandler.fetchAllMessages(chatInfo.chatroomId);
                if (!allMessages.length) throw new Error('불러올 대화 기록이 없습니다.');

                const messagesToProcess = (saveOrder === 'latest') ?
                    allMessages.slice(0, turnCount * 2) :
                    [...allMessages].reverse().slice(0, turnCount * 2);

                const characterName = document.querySelector(SELECTORS.characterName)?.textContent || '캐릭터';
                const safeName = characterName.replace(/[\\/:*?"<>|]/g, '').trim();
                const fileName = `${safeName}.${format}`;

                utils.updateStatus(statusEl, '파일을 생성하는 중...');
                let fileContent, clipboardContent;
                
                switch (format) {
                    case 'html': {
                        const htmlMessages = (saveOrder === 'latest') ? [...messagesToProcess].reverse() : messagesToProcess;
                        fileContent = contentGenerator.generateHtml(htmlMessages, characterName);
                        clipboardContent = contentGenerator.generateTxt(messagesToProcess);
                        break;
                    }
                    case 'txt':
                        fileContent = contentGenerator.generateTxt(messagesToProcess);
                        clipboardContent = fileContent;
                        break;
                    case 'json':
                        fileContent = contentGenerator.generateJson(messagesToProcess);
                        clipboardContent = fileContent;
                        break;
                }
                
                const mimeTypes = { html: 'text/html;charset=utf-8', txt: 'text/plain;charset=utf-8', json: 'application/json;charset=utf-8' };
                utils.downloadFile(fileContent, fileName, mimeTypes[format]);

                localStorage.setItem(CONFIG.storageKey, turnCount);
                
                const savedTurns = Math.floor(messagesToProcess.length / 2);
                const successMsg = `다운로드 성공! 총 ${savedTurns}턴(${messagesToProcess.length}개) 저장.`;

                if (shouldCopy) {
                    await utils.copyToClipboard(clipboardContent, statusEl, successMsg);
                } else {
                    utils.updateStatus(statusEl, successMsg);
                }

            } catch (error) {
                console.error('다운로드 실패:', error);
                utils.updateStatus(statusEl, `오류: ${error.message}`, true);
            }
        }
    };

    app.init();

})();
