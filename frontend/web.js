        const tabsContainer = document.getElementById("tabs");
        const pagesContainer = document.getElementById("pages");
        const newTabButton = document.getElementById("new-tab");
        const urlInput = document.getElementById("url-input");
        const urlForm = document.getElementById("url-form");
        const backButton = document.getElementById("back-button");
        const forwardButton = document.getElementById("forward-button");
        const reloadButton = document.getElementById("reload-button");
        const settingsButton = document.getElementById("settings-button");
        const bookmarksButton = document.getElementById("bookmarks-button");
        const gamesButton = document.getElementById("games-button");
        const bookmarkButton = document.getElementById("bookmark-button");
        const bookmarksModal = document.getElementById("bookmarks-modal");
        const bookmarksList = document.getElementById("bookmarks-list");
        const closeBookmarksButton = document.getElementById("close-bookmarks");
        const gamesModal = document.getElementById("games-modal");
        const gamesList = document.getElementById("games-list");
        const closeGamesButton = document.getElementById("close-games");
        const settingsModal = document.getElementById("settings-modal");
        const tabNameInput = document.getElementById("tab-name-input");
        const browserNameInput = document.getElementById("browser-name-input");
        const faviconInput = document.getElementById("favicon-input");
        const themeSelect = document.getElementById("theme-select");
        const applySettingsButton = document.getElementById("apply-settings-button");
        const closeSettingsButton = document.getElementById("close-settings");
        const resetSettingsButton = document.getElementById("reset-settings");
        const loginButton = document.getElementById("login");
        const MAX_TABS = 12;
        const DEFAULT_BROWSER_NAME = "HideSearch";
        const DEFAULT_THEME = "dark";
        const DEFAULT_FAVICON = document.querySelector('link[rel="icon"]')?.href || "";

        const games = [
            
            {
                name: "Eaglercraft 1.8.8",
                url: "https://raw.githubusercontent.com/catfoolyou/EaglerX-Client/main/EaglercraftX_1.8_WASM-GC_Offline_Download.html"
            },
            
            {
                name: "Eaglercraft 1.12.2",
                url: "https://raw.githubusercontent.com/catfoolyou/EagsWebTest/main/wasm/Eaglercraft_1.12.2_WASM_Offline_Download.html"
            },
            
            {
                name: "Tuff Client",
                url: "https://raw.githubusercontent.com/TuffNetwork/tufftest/v2/files/1_1UT13/WASM/Tuff_Client_Offline_WASM.html"
            },
            
            {
                name: "Wurst Client",
                url: "https://wurst.wiki"
            }

        ];

        let browserName = DEFAULT_BROWSER_NAME;
        let faviconHref = DEFAULT_FAVICON;
        let bookmarks = loadBookmarks();
        let authenticatedUser = null;

        function updateLoginButton() {
            if (!loginButton) return;

            if (authenticatedUser) {
                loginButton.textContent = "Account";
                loginButton.title = `Log out ${authenticatedUser.name}`;
                loginButton.setAttribute("aria-label", loginButton.title);
                return;
            }

            loginButton.textContent = "Login";
            loginButton.title = "Sign in with Google";
            loginButton.setAttribute("aria-label", loginButton.title);
        }

        async function loadAuthenticationState() {
            try {
                const response = await fetch("/api/auth/me", {
                    credentials: "same-origin"
                });

                if (!response.ok) return;

                const state = await response.json();
                authenticatedUser = state.authenticated ? state.user : null;
                updateLoginButton();
            } catch {
                // The browser can still be used when the backend is unavailable.
            }
        }

        async function toggleAuthentication() {
            if (!authenticatedUser) {
                window.location.href = "/api/auth/google";
                return;
            }

            try {
                const response = await fetch("/api/auth/logout", {
                    method: "POST",
                    credentials: "same-origin"
                });

                if (response.ok) {
                    authenticatedUser = null;
                    updateLoginButton();
                }
            } catch {
                // Keep the current account state if logout cannot reach the backend.
            }
        }

        if (loginButton) {
            loginButton.addEventListener("click", toggleAuthentication);
            updateLoginButton();
            loadAuthenticationState();
        }

        function loadBookmarks() {
            try {
                const saved = JSON.parse(localStorage.getItem("hideSearchBookmarks") || "[]");
                return Array.isArray(saved) ? saved.filter(url => typeof url === "string" && url.trim()) : [];
            } catch {
                return [];
            }
        }

        function saveBookmarks() {
            localStorage.setItem("hideSearchBookmarks", JSON.stringify(bookmarks));
        }

        function isBookmarked(url) {
            return !!url && bookmarks.includes(url);
        }

        function updateBookmarkButton(url = getActiveTab()?.url || "") {
            const bookmarked = isBookmarked(url);
            bookmarkButton.textContent = bookmarked ? "★" : "☆";
            bookmarkButton.classList.toggle("bookmarked", bookmarked);
            bookmarkButton.setAttribute("aria-pressed", String(bookmarked));
            bookmarkButton.title = bookmarked ? "Remove bookmark" : "Bookmark this URL";
            bookmarkButton.setAttribute("aria-label", bookmarkButton.title);
        }

        function renderBookmarks() {
            bookmarksList.innerHTML = "";

            if (!bookmarks.length) {
                const empty = document.createElement("div");
                empty.className = "list-empty";
                empty.textContent = "No bookmarks saved yet.";
                bookmarksList.appendChild(empty);
                return;
            }

            bookmarks.forEach(url => {
                const entry = document.createElement("div");
                entry.className = "bookmark-entry";

                const link = document.createElement("button");
                link.className = "bookmark-link";
                link.type = "button";
                link.textContent = url;
                link.title = url;
                link.addEventListener("click", () => {
                    closeBookmarks();
                    navigate(url);
                });

                const remove = document.createElement("button");
                remove.className = "bookmark-remove";
                remove.type = "button";
                remove.textContent = "×";
                remove.title = "Remove bookmark";
                remove.setAttribute("aria-label", `Remove bookmark: ${url}`);
                remove.addEventListener("click", () => {
                    bookmarks = bookmarks.filter(item => item !== url);
                    saveBookmarks();
                    renderBookmarks();
                    updateBookmarkButton();
                });

                entry.appendChild(link);
                entry.appendChild(remove);
                bookmarksList.appendChild(entry);
            });
        }

        function toggleBookmark() {
            const url = getActiveTab()?.url?.trim();
            if (!url) return;

            if (isBookmarked(url)) {
                bookmarks = bookmarks.filter(item => item !== url);
            } else {
                bookmarks.push(url);
            }

            saveBookmarks();
            renderBookmarks();
            updateBookmarkButton(url);
        }

        let tabs = [
            {
                id: 1,
                title: "New Tab",
                customTitle: false,
                url: "",
                history: [],
                historyIndex: -1
            }
        ];

        let activeTabId = 1;
        let nextTabId = 2;

        const firstTab = document.createElement("div");

        firstTab.className = "tab active";
        firstTab.dataset.id = "1";

        firstTab.innerHTML = `
            <span class="tab-title">New Tab</span>
            <button class="close-tab">×</button>
        `;

        tabsContainer.insertBefore(firstTab, newTabButton);

        firstTab.addEventListener("click", function(event) {
            if (!event.target.classList.contains("close-tab")) {
                activateTab(1);
            }
        });

        firstTab.querySelector(".close-tab").addEventListener("click", function(event) {
            event.stopPropagation();
            closeTab(1);
        });

        getIframe(1)?.addEventListener("load", function() {
            syncActiveTabFromIframe();
            applyNewTabTheme(document.body.classList.contains("light-theme"));
        });

        document.title = "New Tab — " + browserName;
        updateTabSizing();

        function getActiveTab() {
            return tabs.find(tab => tab.id === activeTabId);
        }

        function getIframe(id) {
            return document.getElementById(`iframe-${id}`);
        }

        function updateTabSizing() {
            const tabCount = tabs.length;
            tabsContainer.classList.toggle("6-tabs", tabCount >= 6);
            tabsContainer.classList.toggle("10-tabs", tabCount >= 10);
            tabsContainer.classList.toggle("tab-limit-reached", tabCount >= MAX_TABS);
            newTabButton.disabled = tabCount >= MAX_TABS;
        }

        function activateTab(id) {
            activeTabId = id;

            document.querySelectorAll(".tab").forEach(tab => {
                tab.classList.toggle(
                    "active",
                    Number(tab.dataset.id) === id
                );
            });

            document.querySelectorAll("iframe").forEach(iframe => {
                iframe.classList.toggle(
                    "active",
                    iframe.id === `iframe-${id}`
                );
            });

            const tab = getActiveTab();

            if (tab) {
                urlInput.value = tab.url;
                document.title = tab.title ? `${tab.title} — ${browserName}` : browserName;
                updateBookmarkButton(tab.url);
            }
            updateTabSizing();
        }

        function createTab() {
            if (tabs.length >= MAX_TABS) {
                updateTabSizing();
                return null;
            }

            const id = nextTabId++;

            const tab = {
                id: id,
                title: "New Tab",
                customTitle: false,
                url: "",
                history: [],
                historyIndex: -1
            };

            tabs.push(tab);

            const tabElement = document.createElement("div");

            tabElement.className = "tab";
            tabElement.dataset.id = id;

            tabElement.innerHTML = `
                <span class="tab-title">New Tab</span>
                <button class="close-tab">×</button>
            `;

            tabsContainer.insertBefore(tabElement, newTabButton);

            tabElement.addEventListener("click", function(event) {
                if (!event.target.classList.contains("close-tab")) {
                    activateTab(id);
                }
            });

            tabElement.querySelector(".close-tab").addEventListener("click", function(event) {
                event.stopPropagation();
                closeTab(id);
            });

            const iframe = document.createElement("iframe");

            iframe.id = `iframe-${id}`;
            iframe.title = `Tab ${id}`;

            iframe.srcdoc = `
                <!DOCTYPE html>
                <html>
                <body style="
                    margin:0;
                    width:100vw;
                    height:100vh;
                    display:flex;
                    justify-content:center;
                    align-items:center;
                    flex-direction:column;
                    background:#202124;
                    color:white;
                    font-family:Arial,sans-serif;
                ">
                    <h1>HideSearch</h1>
                    <p>Enter a URL above to browse.</p>
                </body>
                </html>
            `;

            pagesContainer.appendChild(iframe);
            iframe.addEventListener("load", function() {
                syncActiveTabFromIframe();
                applyNewTabTheme(document.body.classList.contains("light-theme"));
            });

            activateTab(id);
            updateTabSizing();
            return id;
        }

        function closeTab(id) {
            if (tabs.length === 1) {
                return;
            }

            const index = tabs.findIndex(tab => tab.id === id);

            if (index === -1) {
                return;
            }

            tabs.splice(index, 1);

            const tabElement = document.querySelector(
                `.tab[data-id="${id}"]`
            );

            const iframe = getIframe(id);

            if (tabElement) {
                tabElement.remove();
            }

            if (iframe) {
                iframe.remove();
            }

            if (activeTabId === id) {
                const newIndex = Math.max(0, index - 1);
                activateTab(tabs[newIndex].id);
            }

            updateTabSizing();
        }

        function escapeHTML(value) {
            return String(value)
                .replace(/&/g, "&amp;")
                .replace(/</g, "&lt;")
                .replace(/>/g, "&gt;")
                .replace(/"/g, "&quot;")
                .replace(/'/g, "&#39;");
        }
        
        async function loadDownloadedHTML(iframe, url) {
            if (!iframe) return;

            let parsedURL;

            try {
            parsedURL = new URL(url);
        } catch {
            iframe.removeAttribute("srcdoc");
            iframe.src = url;
            return;
        }

        const isRawContent =
            parsedURL.protocol === "https:" &&
            parsedURL.hostname === "raw.githubusercontent.com";

        if (!isRawContent) {
            iframe.removeAttribute("srcdoc");
            iframe.src = url;
            return;
        }

        try {
            iframe.removeAttribute("srcdoc");

            await new Promise((resolve) => {
                const onLoad = () => {
                    iframe.removeEventListener("load", onLoad);
                    resolve();
                };

                iframe.addEventListener("load", onLoad, { once: true });
                iframe.src = "about:blank";
            });

            const response = await fetch(url);

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }

            const html = await response.text();

            const baseURL = new URL(url);

            baseURL.pathname = baseURL.pathname.substring(
            0,
                baseURL.pathname.lastIndexOf("/") + 1
            );

            const baseTag =
                `<base href="${escapeHTMLAttribute(baseURL.href)}">`;

            const finalHTML = /<head[\s>]/i.test(html)
                ? html.replace(
                    /<head([^>]*)>/i,
                    `<head$1>${baseTag}`
                )
                : `<!DOCTYPE html>
                <html>
                <head>${baseTag}</head>
                <body>${html}</body>
                </html>`;

            const doc = iframe.contentDocument;

            if (!doc) {
                throw new Error("Unable to access document");
            }

            doc.open();
            doc.write(finalHTML);
            doc.close();

        } catch (error) {
            console.error("HideSearch failed to download:", error);

            const doc = iframe.contentDocument;

            if (doc) {
                doc.open();
                doc.write(`
                    <!DOCTYPE html>
                    <html>
                    <body style="
                        margin:0;
                        padding:24px;
                        background:#202124;
                        color:#fff;
                        font-family:Arial,sans-serif
                    ">
                        <h2>Uh Oh. That didn't go well.</h2>

                        <p>HideSearch failed to download:</p>

                        <pre style="
                            white-space:pre-wrap;
                            overflow-wrap:anywhere;
                        ">${escapeHTML(url)}</pre>

                        <p>
                            Error:
                            ${escapeHTML(error.message || String(error))}
                        </p>
                    </body>
                    </html>
                `);
                doc.close();
            }
        }
    }
        function escapeHTMLAttribute(value) {
            return escapeHTML(value);
        }

        function navigate(url, addHistory = true) {
            const tab = getActiveTab();

            if (!tab) {
                return;
            }

            url = url.trim();

            if (!url) {
                return;
            }

            if (
                !url.startsWith("http://") &&
                !url.startsWith("https://") &&
                !url.startsWith("chrome://") &&
                !url.startsWith("about:")
            ) {
                url = "https://" + url;
            }

            const iframe = getIframe(tab.id);

            if (!iframe) {
                return;
            }

            loadDownloadedHTML(iframe, url);

            tab.url = url;

            if (addHistory) {
                tab.history = tab.history.slice(
                    0,
                    tab.historyIndex + 1
                );

                tab.history.push(url);
                tab.historyIndex = tab.history.length - 1;
            }

            urlInput.value = url;
            updateBookmarkButton(url);

            updateTabTitle(tab);
        }

        function updateTabTitle(tab) {
            if (tab.customTitle) {
                const tabElement = document.querySelector(`.tab[data-id="${tab.id}"]`);
                if (tabElement) {
                    const titleElement = tabElement.querySelector(".tab-title");
                    titleElement.textContent = tab.title;
                    titleElement.title = tab.title;
                }
                if (tab.id === activeTabId) {
                    document.title = `${tab.title} — ${browserName}`;
                }
                return;
            }

            let title = "New Tab";

            try {
                const parsed = new URL(tab.url);

                if (parsed.hostname) {
                    title = parsed.hostname;
                }
            } catch {
                title = "New Tab";
            }

            tab.title = title;

            const tabElement = document.querySelector(
                `.tab[data-id="${tab.id}"]`
            );

            if (tabElement) {
                const titleElement = tabElement.querySelector(".tab-title");
                titleElement.textContent = title;
                titleElement.title = title;
            }

            if (tab.id === activeTabId) {
                document.title = `${title} — ${browserName}`;
            }
        }

        function syncActiveTabFromIframe() {
            const tab = getActiveTab();
            if (!tab) return;
            const iframe = getIframe(tab.id);
            if (!iframe) return;

            try {
                const currentUrl = iframe.contentWindow.location.href;
                if (currentUrl && !currentUrl.startsWith("about:srcdoc") && currentUrl !== "about:blank") {
                    const changed = tab.url !== currentUrl;
                    tab.url = currentUrl;
                    urlInput.value = currentUrl;
                    updateBookmarkButton(currentUrl);
                    if (changed && (tab.historyIndex < 0 || tab.history[tab.historyIndex] !== currentUrl)) {
                        tab.history = tab.history.slice(0, tab.historyIndex + 1);
                        tab.history.push(currentUrl);
                        tab.historyIndex = tab.history.length - 1;
                    }
                    updateTabTitle(tab);
                }
            } catch {

            }
        }

        function openSettings() {
            const tab = getActiveTab();
            tabNameInput.value = tab?.customTitle ? tab.title : (tab?.title || "");
            browserNameInput.value = browserName;
            faviconInput.value = faviconHref;
            themeSelect.value = document.body.classList.contains("light-theme") ? "light" : "dark";
            settingsModal.classList.add("open");
            settingsModal.setAttribute("aria-hidden", "false");
            tabNameInput.focus();
        }

        function closeSettings() {
            settingsModal.classList.remove("open");
            settingsModal.setAttribute("aria-hidden", "true");
        }

        function openBookmarks() {
            renderBookmarks();
            bookmarksModal.classList.add("open");
            bookmarksModal.setAttribute("aria-hidden", "false");
        }

        function closeBookmarks() {
            bookmarksModal.classList.remove("open");
            bookmarksModal.setAttribute("aria-hidden", "true");
        }
        
        function renderGames() {
            gamesList.innerHTML = "";

            if (!games.length) {
                const empty = document.createElement("div");
                empty.className = "list-empty";
                empty.textContent = "No games imported yet.";
                gamesList.appendChild(empty);
                return;
            }

            games.forEach(game => {
                if (!game || !game.url) return;

                const entry = document.createElement("div");
                entry.className = "game-entry";

                const launch = document.createElement("button");
                launch.className = "game-launch";
                launch.type = "button";
                launch.textContent = game.name || "Unnamed Game";
                launch.title = game.url;

                launch.addEventListener("click", async () => {
                    const newTabId = createTab();

                    if (newTabId === null) return;

                    closeGames();

                    const tab = getActiveTab();
                    const iframe = getIframe(newTabId);

                    if (!tab || !iframe) return;

                    tab.url = game.url;
                    urlInput.value = game.url;

                    tab.history = [game.url];
                    tab.historyIndex = 0;

                    updateTabTitle(tab);

                    await loadDownloadedHTML(iframe, game.url);
                });

                entry.appendChild(launch);
                gamesList.appendChild(entry);
            });
        }
        
        function openGames() {
            renderGames();
            gamesModal.classList.add("open");
            gamesModal.setAttribute("aria-hidden", "false");
        }

        function closeGames() {
            gamesModal.classList.remove("open");
            gamesModal.setAttribute("aria-hidden", "true");
        }

        settingsButton.addEventListener("click", openSettings);
        bookmarksButton.addEventListener("click", openBookmarks);
        gamesButton.addEventListener("click", openGames);
        bookmarkButton.addEventListener("click", toggleBookmark);
        closeBookmarksButton.addEventListener("click", closeBookmarks);
        closeGamesButton.addEventListener("click", closeGames);

        bookmarksModal.addEventListener("click", function(event) {
            if (event.target === bookmarksModal) closeBookmarks();
        });
        gamesModal.addEventListener("click", function(event) {
            if (event.target === gamesModal) closeGames();
        });
        closeSettingsButton.addEventListener("click", closeSettings);
        settingsModal.addEventListener("click", function(event) {
            if (event.target === settingsModal) closeSettings();
        });

        applySettingsButton.addEventListener("click", function() {
            const tab = getActiveTab();

            const tabName = tabNameInput.value.trim();
            if (tab && tabName) {
                tab.title = tabName;
                tab.customTitle = true;
                updateTabTitle(tab);
            }

            const newBrowserName = browserNameInput.value.trim();
            if (newBrowserName) browserName = newBrowserName;

            const faviconUrl = faviconInput.value.trim();
            if (faviconUrl) {
                let href = faviconUrl;
                if (!/^data:/i.test(href) && !/^https?:\/\//i.test(href) && !/^about:/i.test(href)) {
                    href = "https://" + href;
                }
                let iconLink = document.querySelector('link[rel="icon"]');
                if (!iconLink) {
                    iconLink = document.createElement("link");
                    iconLink.rel = "icon";
                    document.head.appendChild(iconLink);
                }
                iconLink.href = href;
                iconLink.type = "image/x-icon";
                faviconHref = href;
            }

            const light = themeSelect.value === "light";
            document.body.classList.toggle("light-theme", light);
            localStorage.setItem("hideSearchTheme", light ? "light" : "dark");
            applyNewTabTheme(light);

            const active = getActiveTab();
            document.title = active ? `${active.title} — ${browserName}` : browserName;
            closeSettings();
        });

        function applyNewTabTheme(light) {
            document.querySelectorAll("iframe").forEach(iframe => {
                try {
                    if (!iframe.srcdoc || !iframe.contentDocument?.body) return;
                    iframe.contentDocument.body.style.background = light ? "#ffffff" : "#202124";
                    iframe.contentDocument.body.style.color = light ? "#111111" : "#ffffff";
                } catch {}
            });
        }

        resetSettingsButton.addEventListener("click", function() {
            const tab = getActiveTab();

            if (tab) {
                tab.title = "New Tab";
                tab.customTitle = false;
                updateTabTitle(tab);
            }

            browserName = DEFAULT_BROWSER_NAME;
            faviconHref = DEFAULT_FAVICON;

            const iconLink = document.querySelector('link[rel="icon"]');
            if (iconLink) {
                iconLink.href = DEFAULT_FAVICON;
                iconLink.type = "image/svg+xml";
            }

            document.body.classList.remove("light-theme");
            themeSelect.value = DEFAULT_THEME;
            tabNameInput.value = "New Tab";
            browserNameInput.value = DEFAULT_BROWSER_NAME;
            faviconInput.value = DEFAULT_FAVICON;
            localStorage.setItem("hideSearchTheme", DEFAULT_THEME);
            applyNewTabTheme(false);

            const active = getActiveTab();
            document.title = active ? `${active.title} — ${browserName}` : browserName;
            updateBookmarkButton(active?.url || "");
        });

        function applySavedTheme() {
            const saved = localStorage.getItem("hideSearchTheme") || "dark";
            const light = saved === "light";
            document.body.classList.toggle("light-theme", light);
            themeSelect.value = light ? "light" : "dark";
            applyNewTabTheme(light);
        }

        applySavedTheme();

        urlForm.addEventListener("submit", function(event) {
            event.preventDefault();
            navigate(urlInput.value);
        });

        newTabButton.addEventListener("click", function() {
            createTab();
        });

        backButton.addEventListener("click", function() {
            const tab = getActiveTab();

            if (!tab) {
                return;
            }

            const iframe = getIframe(tab.id);

            if (!iframe) {
                return;
            }

            try {
                iframe.contentWindow.history.back();
                setTimeout(syncActiveTabFromIframe, 0);
            } catch {
                if (tab.historyIndex > 0) {
                    tab.historyIndex--;

                    navigate(
                        tab.history[tab.historyIndex],
                        false
                    );
                }
            }
        });

        forwardButton.addEventListener("click", function() {
            const tab = getActiveTab();

            if (!tab) {
                return;
            }

            const iframe = getIframe(tab.id);

            if (!iframe) {
                return;
            }

            try {
                iframe.contentWindow.history.forward();
                setTimeout(syncActiveTabFromIframe, 0);
            } catch {
                if (tab.historyIndex < tab.history.length - 1) {
                    tab.historyIndex++;

                    navigate(
                        tab.history[tab.historyIndex],
                        false
                    );
                }
            }
        });

        reloadButton.addEventListener("click", function() {
            const tab = getActiveTab();

            if (!tab) {
                return;
            }

            const iframe = getIframe(tab.id);

            if (iframe && tab.url) {
                loadDownloadedHTML(iframe, tab.url);
            }
        });

        document.addEventListener("keydown", function(event) {
            if (event.key === "Escape") {
                closeSettings();
                closeBookmarks();
                closeGames();
            }

            if (
                event.ctrlKey &&
                event.key.toLowerCase() === "l"
            ) {
                event.preventDefault();
                urlInput.focus();
                urlInput.select();
            }

            if (
                event.ctrlKey &&
                event.key.toLowerCase() === "t"
            ) {
                event.preventDefault();
                createTab();
            }

            if (
                event.ctrlKey &&
                event.key.toLowerCase() === "w"
            ) {
                event.preventDefault();

                if (tabs.length > 1) {
                    closeTab(activeTabId);
                }
            }
        });

        console.log(document);
    