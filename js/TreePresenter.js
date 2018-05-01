(function () {
    'use strict';

    const classCallCheck = function (instance, Constructor) {
        if (!(instance instanceof Constructor)) {
            throw new TypeError("Cannot call a class as a function");
        }
    };

    const createClass = function () {
        function defineProperties(target, props) {
            for (let i = 0; i < props.length; i++) {
                const descriptor = props[i];
                descriptor.enumerable = descriptor.enumerable || false;
                descriptor.configurable = true;
                if ("value" in descriptor) descriptor.writable = true;
                Object.defineProperty(target, descriptor.key, descriptor);
            }
        }

        return function (Constructor, protoProps, staticProps) {
            if (protoProps) defineProperties(Constructor.prototype, protoProps);
            if (staticProps) defineProperties(Constructor, staticProps);
            return Constructor;
        };
    }();


    const toConsumableArray = function (arr) {
        if (Array.isArray(arr)) {
            for (let i = 0, arr2 = Array(arr.length); i < arr.length; i++) arr2[i] = arr[i];

            return arr2;
        } else {
            return Array.from(arr);
        }
    };

    /**
     * Tree node (presentation slide)
     */
    const Node = function Node(parent, heading, id) {
        classCallCheck(this, Node);

        /**
         * Reference to parent slide
         */
        this.parent = parent;

        /**
         * Presentation heading - h1, h2 etc.
         */
        this.heading = heading;

        this.derivation = null;

        /**
         * Slide description
         */
        this.description = null;

        /**
         * Presentation content - ul, ol, img
         */
        this.content = [];

        /**
         * Reference to left sibling (node on the left with same depth)
         */
        this.leftSibling = null;

        /**
         * Reference to right sibling (node on the right with same depth)
         */
        this.rightSibling = null;

        /**
         * Array with references to all children nodes
         * @type {Array}
         */
        this.children = [];

        /**
         * Unique id of node
         */
        this.id = id;

        /**
         * In some cases, the html outliner can create a new untitled title
         * https://www.w3.org/TR/html5/sections.html#sample-outlines - code example 4
         */
        if (heading.implied) {
            const untitled = document.createElement("H1");
            untitled.innerText = "Tree Presentation";
            untitled.id = "tp-untitled-" + id;
            this.heading = untitled;
        }
    };

    /**
     * Tree when each slide is leaf (Node)
     */
    const Tree = function () {
        function Tree() {
            classCallCheck(this, Tree);

            /**
             * Reference to the root of the tree
             */
            this.root = null;

            /**
             * Array of trees
             * @type {Array}
             */
            this.forest = [];

            /**
             * Unique ID that is assigned to each slide
             * @type {number}
             */
            this.ID = 1;

            /**
             * Presentation number
             * @type {number}
             */
            this.presentationNumber = 0;

            this.activeNode = null;

            this.prevNode = null;
        }

        /**
         * Build tree
         */


        createClass(Tree, [{
            key: 'build',
            value: function build() {
                const outline = HTML5Outline(document.body);
                // outliner can return forest (multiple trees)
                for (let i = 0; i < outline.sections.length; i++) {
                    const root = this.createLeafs(null, outline.sections[i]);
                    this.forest.push(root);
                }
                // set first presentation like default
                this.root = this.forest[0];
                this.activeNode = this.forest[0];
            }

            /**
             * Switch to next presentation
             * @returns {boolean}
             */

        }, {
            key: 'changePresentation',
            value: function changePresentation(next) {
                if (this.forest.length === 1) {
                    return false;
                }

                if (next) {
                    // navigate to next presentation
                    if (this.presentationNumber < this.forest.length - 1) {
                        this.presentationNumber++;
                        this.root = this.forest[this.presentationNumber];
                        this.activeNode = this.forest[this.presentationNumber];
                        return true;
                    } else {
                        this.presentationNumber = 0;
                        this.root = this.forest[this.presentationNumber];
                        this.activeNode = this.forest[this.presentationNumber];
                        return true;
                    }
                } else {
                    // navigate to previous presentation
                    if (this.presentationNumber - 1 < 0) {
                        this.presentationNumber = this.forest.length - 1;
                        this.root = this.forest[this.presentationNumber];
                        this.activeNode = this.forest[this.presentationNumber];
                        return true;
                    } else {
                        this.presentationNumber--;
                        this.root = this.forest[this.presentationNumber];
                        this.activeNode = this.forest[this.presentationNumber];
                        return true;
                    }
                }
            }

            /**
             * If user enter section id into URL (.../#id) find recursively in tree slide with given id and show it
             */

        }, {
            key: 'searchNodeById',
            value: function searchNodeById(node, id) {
                if (node.heading.id === id) {
                    return node;
                }

                let searchedNode = null;
                for (let i = 0; searchedNode === null && i < node.children.length; i++) {
                    searchedNode = this.searchNodeById(node.children[i], id);
                }
                return searchedNode;
            }

            /**
             * Search element by his ID in HTML
             * @param id
             */

        }, {
            key: 'searchById',
            value: function searchById(id) {
                for (let i = 0; i < this.forest.length; i++) {
                    const searchedElem = this.searchNodeById(this.forest[i], id);
                    if (searchedElem) {
                        this.activeNode = searchedElem;
                        this.root = this.forest[i];
                        return searchedElem;
                    }
                }
            }

            /**
             * Return unique ID
             * @returns {number}
             */

        }, {
            key: 'newID',
            value: function newID() {
                this.ID++;
                return this.ID;
            }

            /**
             * Find next - linear traversal
             */

        }, {
            key: 'findNext',
            value: function findNext(node) {
                if (node.parent === null) {
                    return null;
                }

                const nextSibling = this.findNextSibling(node.parent.rightSibling);
                if (nextSibling) {
                    return nextSibling;
                }

                return this.findNext(node.parent);
            }

            /**
             * Find next sibling - linear traversal
             */

        }, {
            key: 'findNextSibling',
            value: function findNextSibling(node) {
                if (node === null) {
                    return null;
                }
                if (node.derivation) {
                    return node;
                } else {
                    return this.findNextSibling(node.rightSibling);
                }
            }

            /**
             * Find follower - linear traversal
             */

        }, {
            key: 'findFollower',
            value: function findFollower(node) {
                // case 1: null
                if (node === null) {
                    return null;
                }
                // case 2: return first child with derivation
                for (let i = 0; i < node.children.length; i++) {
                    if (node.children[i].derivation) {
                        return node.children[i];
                    }
                }
                // case3: return next sibling with derivation
                const nextSibling = this.findNextSibling(node.rightSibling);
                if (nextSibling) {
                    return nextSibling;
                }
                // case4: find next
                return this.findNext(node);
            }

            /**
             * Find previous sibling - linear traversal
             */

        }, {
            key: 'findPrevSibling',
            value: function findPrevSibling(node) {
                if (node === null) {
                    return null;
                }
                if (node.derivation) {
                    return node;
                } else {
                    return this.findPrevSibling(node.leftSibling);
                }
            }

            /**
             * Find predecessor - linear traversal
             */

        }, {
            key: 'findPredecessor',
            value: function findPredecessor(node) {

                // case 1: null
                if (node === null) {
                    return null;
                }
                // case2: return prev sibling with derivation
                const prevSibling = this.findPrevSibling(node.leftSibling);
                if (prevSibling) {
                    return prevSibling;
                }

                // case 3: return parent
                if (node.parent) {
                    return node.parent;
                }

                return null;
            }

            /**
             * Create list for derivation
             * each li of ul is heading of children
             */

        }, {
            key: 'setDerivation',
            value: function setDerivation(node) {
                if (node.children.length) {
                    let derivation = '<ul>';

                    for (let i = 0; i < node.children.length; i++) {
                        if (i === 0) {
                            derivation += '<li><a class="activeLinkArr" href="' + '#' + node.children[i].heading.id + '">';
                            derivation += node.children[i].heading.innerText;
                            derivation += '</a></li>';
                        } else {
                            derivation += '<li><a href="' + '#' + node.children[i].heading.id + '">';
                            derivation += node.children[i].heading.innerText;
                            derivation += '</a></li>';
                        }
                    }

                    // node.children.forEach(function (child) {
                    //     //node.heading.id
                    //     derivation += '<li><a href="' + '#' + child.heading.id + '">';
                    //     derivation += child.heading.innerText;
                    //     derivation += '</a></li>';
                    // });

                    node.derivation = document.createElement('div');
                    derivation += '</ul>';
                    node.derivation.innerHTML += derivation;
                }
            }

            /**
             * Get content if element match with tag name
             * @param node
             * @param element
             */

        }, {
            key: 'getContent',
            value: function getContent(node, element) {
                if (element !== null && element.nodeName !== 'H1' && element.nodeName !== 'H2' && element.nodeName !== 'H3' && element.nodeName !== 'H4' && element.nodeName !== 'H5' && element.nodeName !== 'H6' && element.nodeName !== 'NAV' && element.nodeName !== 'ASIDE' && element.nodeName !== 'SECTION' && element.nodeName !== 'ARTICLE') {
                    node.content.push(element);
                    this.getContent(node, element.nextElementSibling);
                }
            }

            /**
             * Find and save reference to slide content
             * @param node
             */

        }, {
            key: 'setContent',
            value: function setContent(node) {
                this.getContent(node, node.heading.nextElementSibling);
            }

            /**
             * Loop through DOM and add slides into tree like leafs
             */

        }, {
            key: 'createLeafs',
            value: function createLeafs(root, leaf) {

                const node = new Node(root, leaf.heading, this.newID());

                for (let i = 0; i < leaf.sections.length; i++) {
                    node.children.push(this.createLeafs(node, leaf.sections[i]));
                }
                this.setSiblings(node.children);
                this.setDerivation(node);
                this.setContent(node);

                if (node.derivation) {
                    let deriv = node.derivation.innerHTML;
                    node.derivation.innerHTML = '';

                    let printedFirstPar = false;
                    node.content.forEach(function (cont) {
                        if (cont.toString() === '[object HTMLParagraphElement]' && !printedFirstPar) {
                            node.derivation.innerHTML += '<p>' + cont.innerHTML + '</p>';
                            printedFirstPar = true;
                        }
                    });

                    node.derivation.innerHTML += deriv;
                }

                return node;
            }

            /**
             * In presentation is possible to navigate between siblings
             */

        }, {
            key: 'setSiblings',
            value: function setSiblings(siblings) {
                for (let i = 0; i < siblings.length; i++) {
                    if (i - 1 >= 0) {
                        siblings[i].leftSibling = siblings[i - 1];
                    }
                    if (i + 1 < siblings.length) {
                        siblings[i].rightSibling = siblings[i + 1];
                    }
                }
            }

            /**
             * Set slide with given ID like active
             * @param ID
             */

        }, {
            key: 'setSlideByID',
            value: function setSlideByID(node, ID) {
                if (node.id === ID) {
                    this.activeNode = node;
                } else {
                    for (let i = 0; i < node.children.length; i++) {
                        this.setSlideByID(node.children[i], ID);
                    }
                }
            }

            /**
             * Set first child like active node (slide)
             */

        }, {
            key: 'child',
            value: function child() {
                this.activeNode = this.activeNode.children[0];
                return this.activeNode;
            }

            /**
             * Set parent like active node (slide)
             */

        }, {
            key: 'parent',
            value: function parent() {
                this.activeNode = this.activeNode.parent;
                return this.activeNode;
            }

            /**
             * Set right sibling like active node (slide)
             */

        }, {
            key: 'navLinkArr',
            value: function navLinkArr(direction) {
                if (direction === 'up') {
                    let node = $(".activeLinkArr");
                    let prevNode = node.parent().prev().children();

                    let attrNN = prevNode.attr('href');
                    if (typeof attrNN !== typeof undefined && attrNN !== false) {
                        node.attr('class', '');
                        prevNode.attr('class', 'activeLinkArr');
                    }
                } else {
                    let node = $(".activeLinkArr");
                    let nextNode = node.parent().next().children();

                    let attrNN = nextNode.attr('href');
                    if (typeof attrNN !== typeof undefined && attrNN !== false) {
                        node.attr('class', '');
                        nextNode.attr('class', 'activeLinkArr');
                    }
                }
            }
        }, {
            key: 'rightSibling',
            value: function rightSibling() {
                this.activeNode = this.activeNode.rightSibling;
                return this.activeNode;
            }

            /**
             * Set left sibling like active node (slide)
             */

        }, {
            key: 'leftSibling',
            value: function leftSibling() {
                this.activeNode = this.activeNode.leftSibling;
                return this.activeNode;
            }

            /**
             * Format children for mini-map
             */

        }, {
            key: 'getChildrenForGraph',
            value: function getChildrenForGraph(children) {
                const ch = [];
                for (let i = 0; i < children.length; i++) {
                    ch.push({
                        text: {name: children[i].heading.innerText},
                        HTMLclass: children[i].id,
                        children: this.getChildrenForGraph(children[i].children)
                    });
                }
                return ch;
            }

            /**
             * Prepare data for mini-map
             */

        }, {
            key: 'getTreeStructure',
            value: function getTreeStructure() {
                return {
                    text: {name: this.root.heading.innerText},
                    HTMLclass: this.root.id,
                    children: this.getChildrenForGraph(this.root.children)
                };
            }
        }]);
        return Tree;
    }();

    /**
     * Class handles everything related with presentation settings
     */
    const Settings = function () {
        function Settings(presentation, slides, presenter) {
            classCallCheck(this, Settings);


            /**
             * Reference to presentation window in DOM
             */
            this.presentationElem = presentation;

            this.presenter = presenter;

            this.slidesElem = slides;

            this.screenRatio = 1;

            /**
             * Is settings hidden?
             * @type {boolean}
             */
            this.hideNav = false;

            // create settings and apeend it to the presentation window
            this.presentationElem.insertBefore(this.build(), slides);
            this.listen();
            this.listenMouse();
        }

        /**
         * Build settings window
         */


        createClass(Settings, [{
            key: 'build',
            value: function build() {
                const settings = document.createElement('div');
                settings.id = 'tp-settings';

                settings.innerHTML = '\n                    <div id="tp-settings-wrap">\n                        <h1>Settings</h1>\n                        <div>\n                            <h2>Hiding navigation</h2>\n                            <div id="hide-nav">\n                                <label class="switch">\n                                    <input id="hide-nav-button" type="checkbox">\n                                    <div class="slider round"></div>\n                                </label>\n                            </div>\n                        </div>\n                        <div>\n                            <h2>Aspect ratio</h2>\n                            <div id="ratios">\n                                <button id="ratio-4-3">4:3</button>\n                                <button id="ratio-16-9">16:9</button>\n                                <button id="ratio-16-10">16:10</button>\n                                <button id="ratio-auto">auto</button>\n                            </div>\n                        </div>\n                        <div>\n                            <h2>Theme</h2>\n                            <div id="themes">\n                                <button id="black"></button>\n                                <button id="red"></button>\n                                <button id="green"></button>\n                                <button id="blue"></button>\n                            </div>\n                        </div>\n                    </div>';

                return settings;
            }

            /**
             * Show elements on mousemove
             */

        }, {
            key: 'listenMouse',
            value: function listenMouse() {
                const _this = this;

                const icons = document.getElementById('tp-icons');
                const nav = document.getElementById('navigation');
                let timer = null;

                this.slidesElem.addEventListener('mousemove', function () {
                    if (_this.hideNav && !_this.activeSettings) {
                        clearTimeout(timer);
                        icons.classList.add("active");
                        nav.classList.add("active");
                        $('#hide-nav').hide();
                        timer = setTimeout(function () {
                            $('#hide-nav').show();
                            icons.classList.remove("active");
                            nav.classList.remove("active");
                        }, 1500);
                    }
                });
            }

            /**
             * If there is to many items in list make it fit
             */

        }, {
            key: 'adjustListSize',
            value: function adjustListSize() {
                let listType = 'ul';
                let list = document.querySelectorAll('#slides > ' + listType + ' li');
                if (!list.length) {
                    listType = 'ol';
                    list = document.querySelectorAll('#slides > ' + listType + ' li');
                    if (!list.length) {
                        return;
                    }
                }

                let listFontSize = 2.3; // default font size
                const spaceForList = document.getElementById('tree-presenter').clientHeight - document.querySelectorAll('#slides > h1, #slides > h2, #slides > h3, #slides > h4, #slides > h5, #slides > h6')[0].clientHeight - document.getElementById('tp-icons').clientHeight / 2;

                while (spaceForList < document.querySelector('#slides > ' + listType).clientHeight) {
                    if (listFontSize === 0.1) {
                        break;
                    } else {
                        listFontSize -= 0.1;
                    }
                    Array.from(list).forEach(function (elem) {
                        elem.style.fontSize = listFontSize + 'em';
                    });
                }
            }

            /**
             * Calculate new width for given ratio
             * @param ratio
             * @returns {string}
             */

        }, {
            key: 'calculateWidth',
            value: function calculateWidth(ratio, screen) {
                const newWidth = (ratio * screen.height).toFixed(3);
                return (100 / screen.width * newWidth).toFixed(1) + 'vw';
            }

            /**
             * Calculate new height for given ratio
             * @param ratio
             * @returns {string}
             */

        }, {
            key: 'calculateHeight',
            value: function calculateHeight(ratio, screen) {
                const newHeight = (screen.width / ratio).toFixed(3);
                return (100 / screen.height * newHeight).toFixed(1) + 'vh';
            }

            /**
             * Get screen dimensions
             * @returns {{width: (Number|number), height: (Number|number)}}
             */

        }, {
            key: 'getScreenSizes',
            value: function getScreenSizes() {
                const screen = {
                    width: window.innerWidth || document.documentElement.clientWidth || document.body.clientWidth,
                    height: window.innerHeight || document.documentElement.clientHeight || document.body.clientHeight
                };
                screen.ratio = screen.width / screen.height;
                return screen;
            }

            /**
             * Get required screen ratio based on selected button id
             * ratio = screen width / screen height
             * @param id
             * @returns {number}
             */

        }, {
            key: 'getRatioValue',
            value: function getRatioValue(id) {
                let ratio = 0;
                switch (id) {
                    case 'ratio-4-3':
                        ratio = 1.333;
                        break;
                    case 'ratio-16-9':
                        ratio = 1.777;
                        break;
                    case 'ratio-16-10':
                        ratio = 1.6;
                        break;
                    case 'ratio-auto':
                        ratio = 1;
                        break;
                }
                return ratio;
            }

            /**
             * Set button with given ratio like active
             * @param ratio
             */

        }, {
            key: 'setScreenRatioButton',
            value: function setScreenRatioButton(ratio) {
                document.getElementById(ratio).classList.add('active');
            }
        }, {
            key: 'setScreenRatio',
            value: function setScreenRatio(screen) {
                // NOT AUTO MODE
                if (this.screenRatio !== 1) {
                    if (screen.ratio > this.screenRatio) {
                        this.presentationElem.style.width = this.calculateWidth(this.screenRatio, screen);
                        this.presentationElem.style.height = '100vh';
                    } else {
                        this.presentationElem.style.height = this.calculateHeight(this.screenRatio, screen);
                        this.presentationElem.style.width = '100vw';
                    }
                } else {
                    this.presentationElem.style.width = '100vw';
                    this.presentationElem.style.height = '100vh';
                }

                this.adjustListSize();
            }
        }, {
            key: 'updateScreenRatio',
            value: function updateScreenRatio() {
                const screen = this.getScreenSizes();
                this.setScreenRatio(screen);
            }

            /**
             * Set screen width/height based on chosen ratio
             */

        }, {
            key: 'adjustScreenRatio',
            value: function adjustScreenRatio(aspectRatio) {
                const screen = this.getScreenSizes();
                this.screenRatio = this.getRatioValue(aspectRatio);
                localStorage.setItem('aspectRatio', aspectRatio);
                this.setScreenRatio(screen);
            }

            /**
             * Set button with given theme like active
             * @param theme
             */

        }, {
            key: 'setThemeButton',
            value: function setThemeButton(theme) {
                document.getElementById(theme).classList.add('active');
            }

            /**
             * Set presentation color team
             * @param theme
             */

        }, {
            key: 'setTheme',
            value: function setTheme(theme) {
                this.presentationElem.classList.remove('black');
                this.presentationElem.classList.remove('red');
                this.presentationElem.classList.remove('green');
                this.presentationElem.classList.remove('blue');
                this.presentationElem.classList.add(theme);
                localStorage.setItem('theme', theme);
            }

            /**
             * Set hide nav toggle button like active
             */

        }, {
            key: 'setHideNavButton',
            value: function setHideNavButton() {
                document.getElementById('hide-nav-button').checked = true;
            }

            /**
             * Set linear nav toggle button like active
             */

        }, {
            key: 'setLinearNavButton',
            value: function setLinearNavButton() {
                document.getElementById('linear-nav-button').checked = true;
            }

            /**
             * Set/hide arrow navigation
             * @param hideNav
             */

        }, {
            key: 'toggleNavigation',
            value: function toggleNavigation(hideNav) {
                if (hideNav) {
                    document.getElementById('navigation').classList.remove('active');
                    document.getElementById('tp-icons').classList.remove('active');
                } else {
                    document.getElementById('navigation').classList.add('active');
                    document.getElementById('tp-icons').classList.add('active');
                }
                localStorage.setItem('hideNav', hideNav);
                this.hideNav = hideNav;
            }

            /**
             * Listen clicks on settings buttons
             */

        }, {
            key: 'listen',
            value: function listen() {
                const _this2 = this;

                const ratiosElem = document.getElementById('ratios');
                const hideNavElem = document.getElementById('hide-nav-button');
                const themesElem = document.getElementById('themes');

                ratiosElem.addEventListener('click', function (e) {
                    if (e.target.id !== 'ratios') {
                        const children = ratiosElem.children;
                        for (let i = 0; i < children.length; i++) {
                            children[i].classList.remove('active');
                        }
                        e.target.classList.add('active');
                        _this2.adjustScreenRatio(e.target.id);
                    }
                });

                hideNavElem.addEventListener('click', function () {
                    _this2.toggleNavigation(!_this2.hideNav);
                });

                themesElem.addEventListener('click', function (e) {
                    if (e.target.id !== 'themes') {
                        const children = themesElem.children;
                        for (let i = 0; i < children.length; i++) {
                            children[i].classList.remove('active');
                        }
                        e.target.classList.add('active');
                        _this2.setTheme(e.target.id);
                    }
                });
            }

            /**
             * Load settings from Web Storage (localStorage)
             */

        }, {
            key: 'setFromLocalStorage',
            value: function setFromLocalStorage() {
                if (typeof Storage !== 'undefined') {

                    const aspectRatio = localStorage.getItem('aspectRatio');
                    const theme = localStorage.getItem('theme');
                    const hideNav = localStorage.getItem('hideNav');
                    const linearNav = localStorage.getItem('linearNav');

                    if (aspectRatio === 'ratio-4-3' || aspectRatio === 'ratio-16-9' || aspectRatio === 'ratio-16-10' || aspectRatio === 'ratio-auto') {
                        this.adjustScreenRatio(aspectRatio);
                        this.setScreenRatioButton(aspectRatio);
                    } else {
                        this.setScreenRatioButton('ratio-auto');
                    }

                    if (theme === 'black' || theme === 'red' || theme === 'green' || theme === 'blue') {
                        this.setTheme(theme);
                        this.setThemeButton(theme);
                    } else {
                        this.setTheme('red');
                        this.setThemeButton('red');
                    }

                    if (linearNav === 'true') {
                        this.presenter.activeLinearNav = true;
                        this.setLinearNavButton();
                    }

                    if (hideNav === 'true') {
                        this.toggleNavigation(true);
                        this.setHideNavButton();
                    } else {
                        this.toggleNavigation(false);
                    }
                } else {
                    console.warn('No Web Storage support..');
                }
            }
        }]);
        return Settings;
    }();

    /**
     * Allows creation of PDF with derivated content
     */
    const PDF = function () {
        function PDF(tree) {
            classCallCheck(this, PDF);

            this.tree = tree;

            this.doc = {
                pageOrientation: 'landscape',
                styles: {
                    header: {
                        fontSize: 50,
                        bold: true,
                        margin: [0, 0, 0, 50],
                        color: "#2196F3"
                    },
                    list: {
                        fontSize: 35,
                        margin: [0, 0, 0, 40]
                    }
                },
                content: []
            };

            this.setContent(this.tree.root);
        }

        /**
         * Fill PDF with content
         * @param node
         */


        createClass(PDF, [{
            key: 'setContent',
            value: function setContent(node) {
                // If slides has derivation add it
                if (node.derivation) {
                    if (node.parent !== null) {
                        this.doc.content.push({text: '', pageBreak: 'before'});
                    }
                    // slide heading
                    this.doc.content.push({text: node.heading.innerText, style: 'header'});
                    // transform html derivation content to array
                    let nodeList = [].concat(toConsumableArray(node.derivation.childNodes));
                    nodeList = Array.from(nodeList);
                    const list = [];
                    nodeList.forEach(function (node) {
                        list.push(node.innerText);
                    });
                    this.doc.content.push({ul: list, style: 'list'});
                } else {
                    return;
                }

                for (let i = 0; i < node.children.length; i++) {
                    this.setContent(node.children[i]);
                }
            }

            /**
             * Download PDF
             */

        }, {
            key: 'download',
            value: function download() {
                pdfMake.createPdf(this.doc).download('Tree-Presentation.pdf');
            }
        }]);
        return PDF;
    }();

    /**
     * Allows creation of LaTeX with derivated content
     */
    const LaTeX = function () {
        function LaTeX(tree) {
            classCallCheck(this, LaTeX);


            this.tree = tree;

            this.doc = '';

            this.setHeader();
            this.setContent(this.tree.root);
            this.end('document');
        }

        /**
         * Set LaTeX file header
         */


        createClass(LaTeX, [{
            key: 'setHeader',
            value: function setHeader() {
                this.doc += '\\documentclass{beamer}\n\n\\mode<presentation>\n{\n  \\usetheme{default}\n  \\usecolortheme{default}\n  \\usefonttheme{default}\n  \\setbeamertemplate{navigation symbols}{}\n  \\setbeamertemplate{caption}[numbered]\n} \n\n\\usepackage[english]{babel}\n\\usepackage[utf8x]{inputenc}\n\n\\title{Your Title}\n\\author{Your Name}\n\\date{Date of Presentation}\n\n\\begin{document}\n\n\\begin{frame}\n  \\titlepage\n\\end{frame}\n';
            }

            /**
             * Add begin tag
             * @param type
             */

        }, {
            key: 'begin',
            value: function begin(type) {
                this.doc += '\\begin{' + type + '}\n';
            }

            /**
             * Add end tag
             * @param type
             */

        }, {
            key: 'end',
            value: function end(type) {
                this.doc += '\\end{' + type + '}\n';
            }

            /**
             * Set LaTeX file content
             * @param node
             */

        }, {
            key: 'setContent',
            value: function setContent(node) {
                const _this = this;

                if (node.derivation) {
                    this.begin('frame');
                    this.doc += '{' + node.heading.innerText + '}\n';
                    this.begin('itemize');

                    let nodeList = [].concat(toConsumableArray(node.derivation.childNodes));
                    nodeList = Array.from(nodeList);
                    nodeList.forEach(function (node) {
                        _this.doc += '\t\\item ' + node.innerText + '\n';
                    });

                    this.end('itemize');
                    this.end('frame');
                } else {
                    return;
                }

                for (let i = 0; i < node.children.length; i++) {
                    this.setContent(node.children[i]);
                }
            }

            /**
             * Download LaTeX file
             */

        }, {
            key: 'download',
            value: function download() {
                this.prepareFile('Tree-Presentation.tex', this.doc);
            }

            /**
             * Prepare LaTeX file
             */

        }, {
            key: 'prepareFile',
            value: function prepareFile(filename, text) {
                const pom = document.createElement('a');
                pom.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(text));
                pom.setAttribute('download', filename);

                if (document.createEvent) {
                    const event = document.createEvent('MouseEvents');
                    event.initEvent('click', true, true);
                    pom.dispatchEvent(event);
                } else {
                    pom.click();
                }
            }
        }]);
        return LaTeX;
    }();

    /**
     * Allows creation of HTML with derivated content
     */
    const HTML = function () {
        function HTML(tree) {
            classCallCheck(this, HTML);


            this.tree = tree;

            this.setHeader();
            this.doc += '<body>';
            this.setContent(this.tree.root);
            this.doc += '</body>';
        }

        /**
         * Set LaTeX file header
         */


        createClass(HTML, [{
            key: 'setHeader',
            value: function setHeader() {
                this.doc = '\n<!DOCTYPE html>\n<html lang="en">\n<head>\n    <meta charset="UTF-8">\n    <title>Tree Presentation</title>\n</head>\n';
            }

            /**
             * Set LaTeX file content
             * @param node
             */

        }, {
            key: 'setContent',
            value: function setContent(node) {
                const _this = this;

                if (node.derivation) {
                    this.doc += '<h1>' + node.heading.innerText + '</h1>';

                    let nodeList = [].concat(toConsumableArray(node.derivation.childNodes));
                    nodeList = Array.from(nodeList);
                    this.doc += '<ul>';
                    nodeList.forEach(function (node) {
                        _this.doc += '<li>' + node.innerText + '</li>';
                    });
                    this.doc += '</ul>';
                } else {
                    return;
                }

                for (let i = 0; i < node.children.length; i++) {
                    this.setContent(node.children[i]);
                }
            }

            /**
             * Download HTML file
             */

        }, {
            key: 'download',
            value: function download() {
                this.prepareFile('Tree-Presentation.html', this.doc);
            }

            /**
             * Prepare HTML file
             */

        }, {
            key: 'prepareFile',
            value: function prepareFile(filename, text) {
                const pom = document.createElement('a');
                pom.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(text));
                pom.setAttribute('download', filename);

                if (document.createEvent) {
                    const event = document.createEvent('MouseEvents');
                    event.initEvent('click', true, true);
                    pom.dispatchEvent(event);
                } else {
                    pom.click();
                }
            }
        }]);
        return HTML;
    }();

    /**
     * Provides all the necessary operations to run the presentation.
     * (render content into the DOM, navigate between slides etc.)
     */
    const Presenter = function () {
        function Presenter() {
            classCallCheck(this, Presenter);

            /**
             * Is minimap in foreground?
             * @type {boolean}
             */
            this.activeMiniMap = false;

            /**
             * Is settings in foreground?
             * @type {boolean}
             */
            this.activeSettings = false;

            /**
             * Is download in foreground?
             * @type {boolean}
             */
            this.activeDownload = false;

            /**
             * Is help in foreground?
             * @type {boolean}
             */
            this.activeHelp = false;

            /**
             * Is linear navigation active?
             * @type {boolean}
             */
            this.activeLinearNav = false;

            /**
             * False == derivation dimension
             * @type {boolean}
             */
            this.activeZoom = false;

            /**
             * Number of active slide in zoom presentation
             * @type {number}
             */
            this.activeZoomSlide = 0;

            /**
             * Reference to element with presentation slides
             * @type {null}
             */
            this.slidesElem = null;

            /**
             * Reference to element with presentation (settings, minimap, slides)
             * @type {null}
             */
            this.presentationElem = null;

            /**
             * X, Y positions for mobile swipe gestures
             */
            this.xDown = null;
            this.yDown = null;

            this.setPolyfill();

            // Build tree presentation structure based on users HTML5
            this.tree = new Tree();
            this.tree.build();

            this.createPresentationWindow();
            this.createSlidesWindow();
            this.createMinimapWindow();
            this.createDownloadWindow();
            this.createCloseButton();
            this.createHelpWindow();
            this.createIcons();
            this.createNavigation();

            this.droNav = '';
            this.createNavi();

            // Create settings
            this.settings = new Settings(this.presentationElem, this.slidesElem, this);

            this.listenKeys();
            this.listenTouches();
            this.setFirstSlide();
            this.listenHashChanges();

            this.settings.setFromLocalStorage();
            this.listenScreenResize();

            this.pdf = new PDF(this.tree);
            this.latex = new LaTeX(this.tree);
            this.html = new HTML(this.tree);
        }

        createClass(Presenter, [{
            key: 'listenHashChanges',
            value: function listenHashChanges() {
                const _this = this;

                window.addEventListener("hashchange", function () {
                    if (location.hash.slice(1)) {
                        const prevNode = _this.tree.activeNode;
                        let hashUrl = location.hash.slice(1);
                        const searchedElement = _this.tree.searchById(hashUrl);

                        if (searchedElement) {
                            _this.hideSlide(prevNode);
                            _this.showSlide(searchedElement);
                        }
                    }
                }, false);
            }

            /**
             * Adding element.path function to Safari and Mozilla
             */

        }, {
            key: 'setPolyfill',
            value: function setPolyfill() {
                if (!("path" in Event.prototype)) Object.defineProperty(Event.prototype, "path", {
                    get: function get$$1() {
                        const path = [];
                        let currentElem = this.target;
                        while (currentElem) {
                            path.push(currentElem);
                            currentElem = currentElem.parentElement;
                        }
                        if (path.indexOf(window) === -1 && path.indexOf(document) === -1) path.push(document);
                        if (path.indexOf(window) === -1) path.push(window);
                        return path;
                    }
                });
            }

            /**
             * Customize screen on resize
             */

        }, {
            key: 'listenScreenResize',
            value: function listenScreenResize() {
                const _this2 = this;

                this.settings.adjustListSize();
                window.addEventListener('resize', function () {
                    _this2.settings.updateScreenRatio();
                });
            }

            /**
             * Check if user enter slide id if not set root like a default slide
             */

        }, {
            key: 'setFirstSlide',
            value: function setFirstSlide() {
                if (location.hash.slice(1)) {
                    const searchedElement = this.tree.searchById(location.hash.slice(1));
                    if (searchedElement) {
                        this.showSlide(searchedElement);
                    } else {
                        this.showSlide(this.tree.root);
                    }
                } else {
                    this.showSlide(this.tree.root);
                }

                // ALWAYS ON - linear
                this.nav.left.classList.add('active-arrow');
                this.nav.right.classList.add('active-arrow');
            }

            /**
             * Create div in DOM where will be active presentation slides
             */

        }, {
            key: 'createSlidesWindow',
            value: function createSlidesWindow() {
                const p = document.createElement('div');
                p.id = 'slides';

                this.slidesElem = this.presentationElem.appendChild(p);
            }

            /**
             * Create presentation window which will contain slides content, settings and minimap
             */

        }, {
            key: 'createPresentationWindow',
            value: function createPresentationWindow() {
                const body = document.getElementsByTagName('body')[0];
                this.presentationElem = document.createElement('div');
                this.presentationElem.id = 'tree-presenter';
                body.appendChild(this.presentationElem);
            }

            /**
             * Create help window
             */

        }, {
            key: 'createHelpWindow',
            value: function createHelpWindow() {
                const help = document.createElement('div');
                help.id = 'tp-help';

                help.innerHTML = '<div id="tp-help-wrap">\n' +
                    '    <h1>Keyboard shortcuts</h1>\n' +
                    '    <div>\n' +
                    '        <h2>Zoom in / out</h2>\n' +
                    '        <button>SPACE</button>\n' +
                    '    </div>\n' +
                    '    <div>\n' +
                    '        <h2>Hierarchial navigation</h2>\n' +
                    '        <button>← H</button>\n' +
                    '        <button>↓ J</button>\n' +
                    '        <button>→ L</button>\n' +
                    '        <button>↑ K</button>\n' +
                    '    </div>\n' +
                    '    <div>\n' +
                    '        <h2>Linear navigation</h2>\n' +
                    '        <button>←</button>\n' +
                    '        <button>→</button>\n' +
                    '    </div>\n' +
                    '    <div>\n' +
                    '        <h2>Headline navigation</h2>\n' +
                    '        <button>↑</button>\n' +
                    '        <button>↓</button>\n' +
                    '        <button>ENTER</button>\n' +
                    '    </div>\n' +
                    '    <hr>\n' +
                    '    <div>\n' +
                    '        <h2>Settings</h2>\n' +
                    '        <button>S</button>\n' +
                    '    </div>\n' +
                    '    <div>\n' +
                    '        <h2>Presentation map</h2>\n' +
                    '        <button>M</button>\n' +
                    '    </div>\n' +
                    '    <div>\n' +
                    '        <h2>Downloads</h2>\n' +
                    '        <button>D</button>\n' +
                    '    </div>\n' +
                    '    <div>\n' +
                    '        <h2>Help</h2>\n' +
                    '        <button>?</button>\n' +
                    '    </div>\n' +
                    '    <div>\n' +
                    '        <h2>Switch to next presentation</h2>\n' +
                    '        <button>N</button>\n' +
                    '    </div>\n' +
                    '</div>';

                this.presentationElem.insertBefore(help, this.slidesElem);
                // this.listenDownload();
            }

            /**
             * Close active window
             */

        }, {
            key: 'closeActiveWindow',
            value: function closeActiveWindow() {
                if (this.activeMiniMap) {
                    this.toggleMiniMap();
                } else if (this.activeHelp) {
                    this.toggleHelp();
                } else if (this.activeDownload) {
                    this.toggleDownload();
                } else if (this.activeSettings) {
                    this.toggleSettings();
                }
            }

            /**
             * Create close button
             */

        }, {
            key: 'createCloseButton',
            value: function createCloseButton() {
                const _this3 = this;

                const button = document.createElement('div');
                button.id = 'tp-close-window';
                button.innerHTML = '<i class="fa fa-times" aria-hidden="true"></i>';
                this.presentationElem.insertBefore(button, this.slidesElem);

                this.closeButton = document.getElementById('tp-close-window');
                this.closeButton.addEventListener('click', function () {
                    return _this3.closeActiveWindow();
                });
            }

            /**
             * Create download window
             */

        }, {
            key: 'createDownloadWindow',
            value: function createDownloadWindow() {
                const download = document.createElement('div');
                download.id = 'tp-download';

                download.innerHTML = '\n                    <div id="tp-download-wrap">\n                        <h1>Download</h1>\n\n                        <div>\n                            <h2>PDF</h2>\n                            <button id="tp-download-pdf"><i class="fas fa-download fa-lg"></i></button>\n                        </div>\n                        <div>\n                            <h2>LaTeX</h2>\n                            <button id="tp-download-latex"><i class="fas fa-download fa-lg"></i></button>\n                        </div>\n                        <div>\n                            <h2>HTML</h2>\n                            <button id="tp-download-html"><i class="fas fa-download fa-lg"></i></button>\n                        </div>\n                    </div>';
                this.presentationElem.insertBefore(download, this.slidesElem);
                this.listenDownload();
            }

            /**
             * Create window which will contain minimap
             */

        }, {
            key: 'createMinimapWindow',
            value: function createMinimapWindow() {
                const tree = document.createElement('div');
                tree.id = 'tree-structure';
                tree.classList.add('chart');
                this.presentationElem.insertBefore(tree, this.slidesElem);
            }

            /**
             * Create icons
             */

        }, {
            key: 'createIcons',
            value: function createIcons() {
                const icons = document.createElement('div');
                icons.id = 'tp-icons';

                icons.innerHTML = '\n                    <a class="fas fa-question fa-lg" id="tp-icon-help"></a>\n                    <a class="fas fa-download fa-lg" id="tp-icon-download"></a>\n                    <a class="fas fa-cog fa-lg" id="tp-icon-settings"></a>\n                    <a class="fas fa-sitemap fa-lg" id="tp-icon-map"></a>\n                    ';

                this.slidesElem.appendChild(icons);
                this.listenIcons();
            }

            /**
             * Create navigation
             */

        }, {
            key: 'createNavi',
            value: function createNavi() {
                this.droNav = document.createElement('div');
                this.droNav.id = 'tp-navigation';
                this.slidesElem.appendChild(this.droNav);
            }

        }, {
            key: 'createNavigation',
            value: function createNavigation() {
                const navigation = document.createElement('div');
                navigation.id = 'navigation';

                navigation.innerHTML = '\n<div id="navigation-wrap">' +
                    '\n<div id="tp-left">H ←</div>' +
                    '\n<div id="tp-right">L →</div>' +
                    '\n<div id="tp-up">K</div>' +
                    '\n<div id="tp-down">J</div>' +
                    '\n<div id="tp-zoom"></div>' +
                    '\n</div>\n';

                this.slidesElem.appendChild(navigation);
                this.listenNavigation();
            }

            /**
             * Toggle arrows color
             */

        }, {
            key: 'toggleArrows',
            value: function toggleArrows(left, right, up, down, zoomIn, zoomOut) {
                let contents = this.tree.activeNode.content.length;

                if (this.tree.activeNode.derivation === null) {
                    contents--;
                }

                if (this.activeZoom && contents > 0) {
                    if (right) {
                        this.nav.right.classList.remove('active-arrowL');
                        this.nav.right.classList.add('active-arrow')
                    } else {
                        this.nav.right.classList.remove('active-arrow');
                        this.nav.right.classList.add('active-arrowL')
                    }
                    if (left) {
                        this.nav.left.classList.remove('active-arrowL');
                        this.nav.left.classList.add('active-arrow')
                    } else {
                        this.nav.left.classList.remove('active-arrow');
                        this.nav.left.classList.add('active-arrowL')
                    }
                } else {
                    this.nav.right.classList.remove('active-arrowL');
                    this.nav.right.classList.add('active-arrow');
                    this.nav.left.classList.remove('active-arrowL');
                    this.nav.left.classList.add('active-arrow')
                }
                up ? this.nav.up.classList.add('active-arrow') : this.nav.up.classList.remove('active-arrow');
                down ? this.nav.down.classList.add('active-arrow') : this.nav.down.classList.remove('active-arrow');
                zoomIn ? this.nav.zoom.classList.add('active-in') : this.nav.zoom.classList.remove('active-in');
                zoomOut ? this.nav.zoom.classList.add('active-out') : this.nav.zoom.classList.remove('active-out');
            }

            /**
             * Set arrow color based on position in presentation
             */

        }, {
            key: 'setNavigationArrows',
            value: function setNavigationArrows() {
                if (this.activeZoom && !this.tree.activeNode.derivation) {
                    this.toggleArrows(this.tree.activeNode.content[this.activeZoomSlide - 1] || this.tree.activeNode.leftSibling, this.tree.activeNode.content[this.activeZoomSlide + 1] || this.tree.activeNode.rightSibling, true, false, false, true);
                } else if (this.activeZoom) {
                    this.toggleArrows(this.tree.activeNode.content[this.activeZoomSlide - 1], this.tree.activeNode.content[this.activeZoomSlide + 1], true, false, false, true);
                } else {
                    this.toggleArrows(this.tree.activeNode.leftSibling, this.tree.activeNode.rightSibling, this.tree.activeNode.parent, this.tree.activeNode.children.length, this.tree.activeNode.content.length, false);
                }
            }

            /**
             * Set hash (heading id) in url
             */

        }, {
            key: 'setHashInUrl',
            value: function setHashInUrl(id, contentId = null) {
                if (id) {
                    if (contentId !== null) {
                        window.location.hash = '#' + id + '/' + contentId;
                    } else {
                        window.location.hash = '#' + id;
                    }
                }
            }

            /**
             * Add slide to presentation div
             */

        }, {
            key: 'showSlide',
            value: function showSlide(slide) {
                this.slidesElem.appendChild(slide.heading);
                if (slide.derivation) {
                    this.slidesElem.appendChild(slide.derivation);
                    this.activeZoom = false;
                } else if (slide.content.length) {
                    this.slidesElem.appendChild(slide.content[this.activeZoomSlide]);
                    this.activeZoom = true;
                }
                this.settings.adjustListSize();
                this.setNavigationArrows();

                this.droNav.innerHTML = '';
                let headings = [];
                let position = this.tree.activeNode;

                while (position) {
                    headings.push(position);
                    position = position.parent;
                }

                headings.reverse();

                let contents = slide.content.length;

                if (slide.derivation === null) {
                    contents--;
                }

                for (let i = 0; i < headings.length; i++) {
                    if (i === headings.length - 1) {
                        this.droNav.innerHTML += headings[i].heading.innerText + ' (' + contents + ')';
                    } else {
                        this.droNav.innerHTML += '<a href="#' + headings[i].heading.id + '">' + headings[i].heading.innerText + '</a>' + ' > ';
                    }
                }

                this.setHashInUrl(slide.heading.id);
            }

            /**
             * Remove slide from presentation div
             */

        }, {
            key: 'hideSlide',
            value: function hideSlide(slide) {
                this.slidesElem.removeChild(slide.heading);
                if (this.activeZoom && slide.content.length) {
                    this.slidesElem.removeChild(slide.content[this.activeZoomSlide]);
                } else if (slide.derivation) {
                    this.slidesElem.removeChild(slide.derivation);
                }
            }
        }, {
            key: 'changeSlideContent',
            value: function changeSlideContent(direction) {
                if (this.tree.activeNode.content[this.activeZoomSlide + direction]) {
                    this.slidesElem.removeChild(this.tree.activeNode.content[this.activeZoomSlide]);
                    this.slidesElem.appendChild(this.tree.activeNode.content[this.activeZoomSlide + direction]);
                    this.activeZoomSlide += direction;
                    this.settings.adjustListSize();
                    this.setNavigationArrows();
                } else if (!this.tree.activeNode.derivation && direction === 1 && this.tree.activeNode.rightSibling) {
                    this.hideSlide(this.tree.activeNode);
                    this.activeZoomSlide = 0;
                    this.showSlide(this.tree.rightSibling());
                } else if (!this.tree.activeNode.derivation && direction === -1 && this.tree.activeNode.leftSibling) {
                    this.hideSlide(this.tree.activeNode);
                    if (!this.tree.activeNode.leftSibling.derivation && this.tree.activeNode.leftSibling.content.length) {
                        this.activeZoomSlide = this.tree.activeNode.leftSibling.content.length - 1;
                    } else {
                        this.activeZoomSlide = 0;
                    }
                    this.showSlide(this.tree.leftSibling());
                }

                if (this.tree.activeNode.content.length > 1) {
                    let slideId = this.tree.activeNode.heading.id;
                    let contentId = this.activeZoomSlide;
                    this.setHashInUrl(slideId, contentId);
                }
            }

            /**
             * Select active slide in minimap
             * @param newID
             */

        }, {
            key: 'selectNodeInMap',
            value: function selectNodeInMap(newID) {
                Array.from(document.getElementsByClassName("node")).forEach(function (element) {
                    return element.classList.remove('active');
                });
                document.getElementsByClassName(newID)[0].classList.add('active');
            }

            /**
             * Navigate to child
             */

        }, {
            key: 'navChild',
            value: function navChild() {
                if (!this.activeZoom && this.tree.activeNode.children.length) {
                    this.hideSlide(this.tree.activeNode);
                    this.showSlide(this.tree.child());
                }
            }

            /**
             * Navigate to parent
             */

        }, {
            key: 'navParent',
            value: function navParent() {
                if (this.activeZoom && this.tree.activeNode.derivation) {
                    this.navZoom();
                } else if (this.tree.activeNode.parent) {
                    this.hideSlide(this.tree.activeNode);
                    this.activeZoomSlide = 0;
                    this.showSlide(this.tree.parent());
                }
            }

            /**
             * Navigate to next slide in linear nav
             */

        }, {
            key: 'changeLinkAr',
            value: function changeLinkAr(direction) {
                this.tree.navLinkArr(direction);
            }
        }, {
            key: 'goToSlideArrow',
            value: function goToSlideArrow() {
                this.tree.prevNode = this.tree.activeNode;
                const hrefActive = $(".activeLinkArr");

                if (hrefActive.attr('href')) {
                    window.location.href = hrefActive.attr('href');
                }
            }
        }, {
            key: 'navLinearForward',
            value: function navLinearForward() {

                this.tree.prevNode = this.tree.activeNode;

                if (this.activeZoom) {
                    let tmpSlideZoom = this.activeZoomSlide;
                    let tmpSlide = this.tree.activeNode;
                    if (this.activeMiniMap) {
                        this.navParent();
                        this.navChild();
                    } else {
                        this.navRightSibling();
                    }
                    if (this.activeZoomSlide === tmpSlideZoom && this.tree.activeNode === tmpSlide && this.tree.activeNode.children.length === 0 && this.tree.activeNode.rightSibling === null) {
                        this.navParent();
                        this.navRightSibling();
                    }
                } else if (this.tree.activeNode.children.length) {
                    this.hideSlide(this.tree.activeNode);
                    this.showSlide(this.tree.child());
                } else if (this.tree.activeNode.rightSibling) {
                    this.hideSlide(this.tree.activeNode);
                    this.showSlide(this.tree.rightSibling());
                } else {
                    this.navParent();
                }
            }

            /**
             * Navigate to right sibling
             */

        }, {
            key: 'navRightSibling',
            value: function navRightSibling() {

                if (this.activeMiniMap && !this.tree.activeNode.rightSibling) {
                    this.navLinearForward();
                } else if (this.activeLinearNav) {
                    this.navLinearForward();
                } else if (this.activeZoom) {
                    this.changeSlideContent(1);
                } else if (this.tree.activeNode.rightSibling) {
                    this.hideSlide(this.tree.activeNode);
                    this.showSlide(this.tree.rightSibling());
                }
            }

            /**
             * Navigate to previous slide in linear nav
             */

        }, {
            key: 'navLinearBackward',
            value: function navLinearBackward() {

                if (this.activeZoom) {
                    if (this.tree.activeNode.children.length === 0 && this.tree.activeNode.leftSibling === null) {
                        if (this.tree.prevNode && this.tree.prevNode !== this.tree.activeNode) {
                            this.hideSlide(this.tree.activeNode);
                            this.tree.activeNode = this.tree.prevNode;
                            this.showSlide(this.tree.activeNode);
                        } else {
                            this.navParent();
                            while (this.tree.activeNode.leftSibling === null && this.tree.activeNode.parent !== null) {
                                this.navParent();
                            }
                            this.navLeftSibling();
                        }
                    } else {
                        if (this.tree.prevNode && this.tree.prevNode !== this.tree.activeNode) {
                            this.hideSlide(this.tree.activeNode);
                            this.tree.activeNode = this.tree.prevNode;
                            this.showSlide(this.tree.activeNode);
                        } else {
                            this.changeSlideContent(-1);
                        }
                    }
                } else if (this.tree.prevNode && this.tree.prevNode !== this.tree.activeNode) {
                    this.hideSlide(this.tree.activeNode);
                    this.tree.activeNode = this.tree.prevNode;
                    this.showSlide(this.tree.activeNode);
                } else if (this.tree.activeNode.children.length) {
                    this.hideSlide(this.tree.activeNode);
                    this.showSlide(this.tree.child());
                    while (this.tree.activeNode.rightSibling !== null) {
                        this.hideSlide(this.tree.activeNode);
                        this.showSlide(this.tree.rightSibling());
                    }
                } else if (this.tree.activeNode.leftSibling) {
                    this.hideSlide(this.tree.activeNode);
                    this.showSlide(this.tree.leftSibling());
                } else {
                    this.navParent();
                }

                this.tree.prevNode = this.tree.activeNode;
            }

            /**
             * Navigate to left sibling
             */

        }, {
            key: 'navLeftSibling',
            value: function navLeftSibling() {

                if (this.activeMiniMap && !this.tree.activeNode.leftSibling) {
                    this.navLinearBackward();
                } else if (this.activeLinearNav) {
                    this.navLinearBackward();
                } else if (this.activeZoom) {
                    this.changeSlideContent(-1);
                } else if (this.tree.activeNode.leftSibling) {
                    this.hideSlide(this.tree.activeNode);
                    this.showSlide(this.tree.leftSibling());
                }
            }

            /**
             * Zoom in or zoom out
             */

        }, {
            key: 'navZoom',
            value: function navZoom() {
                if (this.tree.activeNode.content.length && !this.activeZoom) {
                    this.slidesElem.removeChild(this.tree.activeNode.derivation);
                    this.slidesElem.appendChild(this.tree.activeNode.content[this.activeZoomSlide]);
                    this.activeZoom = true;
                    this.activeZoomSlide = 0;
                    this.setNavigationArrows();

                    let slideId = this.tree.activeNode.heading.id;
                    let contentId = this.activeZoomSlide;
                    this.setHashInUrl(slideId, contentId);

                } else if (this.tree.activeNode.content.length && this.activeZoom && this.tree.activeNode.derivation) {
                    this.slidesElem.removeChild(this.tree.activeNode.content[this.activeZoomSlide]);
                    this.slidesElem.appendChild(this.tree.activeNode.derivation);
                    this.activeZoom = false;
                    this.activeZoomSlide = 0;
                    this.setNavigationArrows();

                    let slideId = this.tree.activeNode.heading.id;
                    this.setHashInUrl(slideId);

                    // ALWAYS ON - linear
                    this.nav.right.classList.remove('active-arrowL');
                    this.nav.left.classList.remove('active-arrowL');
                    this.nav.left.classList.add('active-arrow');
                    this.nav.right.classList.add('active-arrow');
                }
            }
        }, {
            key: 'toggleCloseButton',
            value: function toggleCloseButton() {
                this.closeButton.classList.toggle('active');
            }

            /**
             * Show or hide mini-map
             */

        }, {
            key: 'toggleMiniMap',
            value: function toggleMiniMap() {
                this.selectNodeInMap(this.tree.activeNode.id);
                document.getElementById('tree-structure').classList.toggle('active');
                this.toggleCloseButton();
                this.activeMiniMap = !this.activeMiniMap;
            }

            /**
             * Show or hide settings
             */

        }, {
            key: 'toggleSettings',
            value: function toggleSettings() {
                document.getElementById('tp-settings').classList.toggle('active');
                this.toggleCloseButton();
                this.activeSettings = !this.activeSettings;
            }

            /**
             * Show or hide settings
             */

        }, {
            key: 'toggleHelp',
            value: function toggleHelp() {
                document.getElementById('tp-help').classList.toggle('active');
                this.toggleCloseButton();
                this.activeHelp = !this.activeHelp;
            }

            /**
             * Show or hide download
             */

        }, {
            key: 'toggleDownload',
            value: function toggleDownload() {
                document.getElementById('tp-download').classList.toggle('active');
                this.toggleCloseButton();
                this.activeDownload = !this.activeDownload;
            }

            /**
             * Handle touch start
             * @param e
             */

        }, {
            key: 'handleTouchStart',
            value: function handleTouchStart(e) {
                this.xDown = e.touches[0].clientX;
                this.yDown = e.touches[0].clientY;
            }
        }, {
            key: 'handleTouchMove',


            /**
             * Handle touch move
             */
            value: function handleTouchMove(e) {
                if (!this.xDown || !this.yDown) {
                    return;
                }

                const xUp = e.touches[0].clientX;
                const yUp = e.touches[0].clientY;

                const xDiff = this.xDown - xUp;
                const yDiff = this.yDown - yUp;

                if (Math.abs(xDiff) > Math.abs(yDiff)) {
                    if (xDiff > 0) {
                        this.navRightSibling();
                    } else {
                        this.navLeftSibling();
                    }
                } else {
                    if (yDiff > 0) {
                        this.navChild();
                    } else {
                        this.navParent();
                    }
                }
                this.xDown = null;
                this.yDown = null;
            }
        }, {
            key: 'listenTouches',


            /**
             * Handle swipe gestures
             */
            value: function listenTouches() {
                const _this4 = this;

                this.presentationElem.addEventListener('touchstart', function (e) {
                    if (!_this4.activeMiniMap && !_this4.activeSettings) {
                        _this4.handleTouchStart(e);
                    }
                }, false);
                this.presentationElem.addEventListener('touchmove', function (e) {
                    if (!_this4.activeMiniMap && !_this4.activeSettings) {
                        _this4.handleTouchMove(e);
                    }
                }, false);
            }

            /**
             * Listen clicks on download
             */

        }, {
            key: 'listenDownload',
            value: function listenDownload() {
                const _this5 = this;

                const pdf = document.getElementById('tp-download-pdf');
                const latex = document.getElementById('tp-download-latex');
                const html = document.getElementById('tp-download-html');

                pdf.addEventListener('click', function () {
                    return _this5.pdf.download();
                });
                latex.addEventListener('click', function () {
                    return _this5.latex.download();
                });
                html.addEventListener('click', function () {
                    return _this5.html.download();
                });
            }

            /**
             * Listen clicks on icons
             */

        }, {
            key: 'listenIcons',
            value: function listenIcons() {
                const _this6 = this;

                this.icons = {
                    map: document.getElementById("tp-icon-map"),
                    settings: document.getElementById("tp-icon-settings"),
                    help: document.getElementById("tp-icon-help"),
                    download: document.getElementById("tp-icon-download")
                };

                this.icons.map.addEventListener("click", function () {
                    return _this6.toggleMiniMap();
                });
                this.icons.settings.addEventListener("click", function () {
                    return _this6.toggleSettings();
                });
                this.icons.help.addEventListener("click", function () {
                    return _this6.toggleHelp();
                });
                this.icons.download.addEventListener("click", function () {
                    return _this6.toggleDownload();
                });
            }

            /**
             * Listen clicks on navigation menu
             */

        }, {
            key: 'listenNavigation',
            value: function listenNavigation() {
                const _this7 = this;

                this.nav = {
                    left: document.getElementById("tp-left"),
                    right: document.getElementById("tp-right"),
                    down: document.getElementById("tp-down"),
                    up: document.getElementById("tp-up"),
                    zoom: document.getElementById("tp-zoom")
                };

                this.nav.down.addEventListener("click", function () {
                    return _this7.navChild();
                });
                this.nav.up.addEventListener("click", function () {
                    return _this7.navParent();
                });
                this.nav.left.addEventListener("click", function () {
                    return _this7.navLeftSibling();
                });
                this.nav.right.addEventListener("click", function () {
                    return _this7.navRightSibling();
                });
                this.nav.zoom.addEventListener("click", function () {
                    return _this7.navZoom();
                });
            }
        }, {
            key: 'changePresentation',
            value: function changePresentation(next) {
                const activeSlide = this.tree.activeNode;
                if (this.tree.changePresentation(next)) {
                    this.hideSlide(activeSlide);
                    this.showSlide(this.tree.activeNode);
                    this.presentationElem.removeChild(document.getElementById("tree-structure"));

                    this.createMinimapWindow();
                    new Treant(this.getTreeStructure());
                    this.listenMinimapNodes();
                }
            }
        }, {
            key: 'canNavigate',
            value: function canNavigate(action) {
                switch (action) {
                    case 'download':
                        return !this.activeMiniMap && !this.activeSettings && !this.activeHelp;
                    case 'help':
                        return !this.activeMiniMap && !this.activeSettings && !this.activeDownload;
                    case 'settings':
                        return !this.activeMiniMap && !this.activeDownload && !this.activeHelp;
                    case 'map':
                        return !this.activeSettings && !this.activeDownload && !this.activeHelp;
                    default:
                        return !this.activeSettings && !this.activeDownload && !this.activeHelp;
                }
            }

            /**
             * Close window
             */

        }, {
            key: 'openedMap',
            value: function openedMap() {
                return this.activeMiniMap;
            }

        }, {
            key: 'goBack',
            value: function goBack() {
                window.history.back();
            }
        }, {
            key: 'closeWindow',
            value: function closeWindow() {
                if (this.activeSettings) {
                    this.toggleSettings();
                } else if (this.activeDownload) {
                    this.toggleDownload();
                } else if (this.activeHelp) {
                    this.toggleHelp();
                } else if (this.activeMiniMap) {
                    this.toggleMiniMap();
                }
            }

            /**
             * Handle arrow keys
             */

        }, {
            key: 'listenKeys',
            value: function listenKeys() {
                const _this8 = this;

                document.onkeydown = function (e) {
                    switch (e.key) {
                        case ' ':
                            if (_this8.canNavigate('zoom')) _this8.navZoom();
                            break;
                        case 'Escape':
                            _this8.closeWindow();
                            break;
                        case 'h':
                            if (_this8.canNavigate('left')) {
                                _this8.navLeftSibling();
                                _this8.toggleMiniMap();
                                _this8.toggleMiniMap();
                            }
                            break;
                        case 'k':
                            if (_this8.canNavigate('up')) {
                                _this8.navParent();
                                _this8.toggleMiniMap();
                                _this8.toggleMiniMap();
                            }
                            break;
                        case 'l':
                            if (_this8.canNavigate('right')) {
                                _this8.navRightSibling();
                                _this8.toggleMiniMap();
                                _this8.toggleMiniMap();
                            }
                            break;
                        case 'j':
                            if (_this8.canNavigate('down')) {
                                _this8.navChild();
                                _this8.toggleMiniMap();
                                _this8.toggleMiniMap();
                            }
                            break;
                        case 'd':
                            if (_this8.canNavigate('download')) _this8.toggleDownload();
                            break;
                        // case 'i':
                        //     if (_this8.canNavigate('help')) _this8.toggleHelp();
                        //     break;
                        case '?':
                            if (_this8.canNavigate('help')) _this8.toggleHelp();
                            break;
                        case 'm':
                            if (_this8.canNavigate('map')) {
                                _this8.toggleMiniMap();
                            }
                            break;
                        case 'ArrowRight':
                            if (_this8.canNavigate('right')) {
                                if (_this8.openedMap()) {
                                    _this8.navRightSibling();
                                    _this8.toggleMiniMap();
                                    _this8.toggleMiniMap();
                                } else {
                                    _this8.navLinearForward();
                                    _this8.toggleMiniMap();
                                    _this8.toggleMiniMap();
                                }
                            }
                            break;
                        case 'ArrowLeft':
                            if (_this8.canNavigate('left')) {
                                if (_this8.openedMap()) {
                                    _this8.navLeftSibling();
                                    _this8.toggleMiniMap();
                                    _this8.toggleMiniMap();
                                } else {
                                    _this8.navLinearBackward();
                                    _this8.toggleMiniMap();
                                    _this8.toggleMiniMap();
                                }
                            }
                            break;
                        case 'n':
                            if (_this8.canNavigate('change')) {
                                if (e.key === "n") {
                                    _this8.changePresentation(true);
                                } else {
                                    _this8.changePresentation(false);
                                }
                            }
                            break;
                        case 's':
                            if (_this8.canNavigate('settings')) {
                                _this8.toggleSettings();
                            }
                            break;
                        case 'ArrowUp':
                            if (_this8.openedMap()) {
                                _this8.navParent();
                                _this8.toggleMiniMap();
                                _this8.toggleMiniMap();
                            } else {
                                _this8.changeLinkAr('up');
                            }
                            break;
                        case 'ArrowDown':
                            if (_this8.openedMap()) {
                                _this8.navChild();
                                _this8.toggleMiniMap();
                                _this8.toggleMiniMap();
                            } else {
                                _this8.changeLinkAr('down');
                            }
                            break;
                        case 'Enter':
                            if (!_this8.openedMap()) {
                                _this8.goToSlideArrow();
                            } else {
                                _this8.toggleMiniMap();
                            }
                            break;
                        case 'Backspace':
                            _this8.goBack();
                            break;
                    }
                };
            }

            /**
             * Get ID of clicked node and set it like active slide
             * @param element
             */

        }, {
            key: 'switchToSlide',
            value: function switchToSlide(element) {
                const nodeID = Number(element.path[1].classList[1]);
                this.hideSlide(this.tree.activeNode);
                this.tree.setSlideByID(this.tree.root, nodeID);
                this.showSlide(this.tree.activeNode);
                this.selectNodeInMap(nodeID);
                this.toggleMiniMap();
            }

            /**
             * Listen mini-map nodes onclick
             */

        }, {
            key: 'listenMinimapNodes',
            value: function listenMinimapNodes() {
                const _this9 = this;

                Array.from(document.getElementsByClassName("node")).forEach(function (element) {
                    return element.addEventListener("click", function (e) {
                        return _this9.switchToSlide(e);
                    });
                });
            }

            /**
             * Get data for mini-map (tree structure diagram)
             */

        }, {
            key: 'getTreeStructure',
            value: function getTreeStructure() {
                return {
                    chart: {
                        container: "#tree-structure",
                        levelSeparation: 60,
                        siblingSeparation: 60
                    },
                    nodeStructure: this.tree.getTreeStructure()
                };
            }
        }]);
        return Presenter;
    }();

    document.addEventListener("DOMContentLoaded", function () {
        /**
         * START PRESENTATION
         */
        const presentation = new Presenter();

        /**
         * CREATE MINIMAP
         */
        new Treant(presentation.getTreeStructure());
        presentation.listenMinimapNodes();
    });

}());