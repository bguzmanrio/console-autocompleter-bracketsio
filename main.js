define(function(require, exports, module) {
  
  var CONSOLE_AUTOCOMPLETER_LOG = "console.log.autocompleter";
  var CONSOLE_AUTOCOMPLETER_INFO = "console.info.autocompleter";
  var CONSOLE_AUTOCOMPLETER_EDIT_DEFAULT = "console.info.edit.default";

  var CommandManager = brackets.getModule("command/CommandManager");
  var AppInit = brackets.getModule("utils/AppInit");
  var DocumentManager = brackets.getModule("document/DocumentManager");
  var KeyBindingManager = brackets.getModule('command/KeyBindingManager');
  var MenuManager = brackets.getModule('command/Menus');
  var DialogManager = brackets.getModule('widgets/Dialogs');
  
  var positionsBack = 0;
  var CONSOLE_LOG = "console.%f('%d%w', %w);";
  var fileParams = JSON.parse(require('text!params.json') || '{}');
  var preferencesKey = 'bguzmanrio.console-extender';
  var defaultText;
  var params;
  var currentDoc;
  var EditorManager;
  var editor;
  var functionToApply; 

  var getWordInPosition = function(line, cursorColumn) {
    var words;
    var nWords;
    var lastWord = '';
    var lastIndex = 1;

    line = line.substring(0, cursorColumn);
    words = line.split(/\W/) || [];
    nWords = words.length;

    return getLastWord();

    function getLastWord() {
      lastWord = words[nWords - lastIndex] || '';
      if(!lastWord && lastIndex <= nWords){
        lastIndex++;
        positionsBack = lastIndex-1;
        lastWord = getLastWord();
      }
      return lastWord;
    }
  };
  

  var setLog = function() {
    functionToApply = 'log';
    addConsoleLog();
  };

  var setLogInfo = function() {
    functionToApply = 'info';
    addConsoleLog();
  };


  var addConsoleLog = function() {
    var currentPos;
    var line;
    var word;
    var startPosition;

    getEditor();
    getPosition();
    getWord();
    getWordStartPosition();
    replaceWord();
    setPosition();

    function getEditor() {
      currentDoc = DocumentManager.getCurrentDocument();
      EditorManager = brackets.getModule("editor/EditorManager");
      editor = EditorManager.getCurrentFullEditor();
    };

    function getPosition() {
      currentPos = editor.getCursorPos();
    };

    function getWord() {
      line = editor.document.getLine(currentPos.line);
      word = getWordInPosition(line, currentPos.ch);
    };

    function getWordStartPosition() {
      startPosition = {
        line: currentPos.line,
        ch: currentPos.ch - word.length - positionsBack
      }; 
    };

    function replaceWord() {
      var cLog = CONSOLE_LOG.replace(/\%w/g, word);
      var pos = editor.getSelection();

      cLog = cLog.replace(/\%d/g, defaultText + ' ').replace(/\%f/g, functionToApply);
      currentDoc.replaceRange(cLog, startPosition, pos.end);
    };
    
    function setPosition() {
      currentPos = editor.getCursorPos();
      
      editor.setSelections([{
        start: {
          line : currentPos.line,
          ch: currentPos.ch - word.length - 2 - 3
        },
        end: {
          line : currentPos.line,
          ch: currentPos.ch - word.length - 2 - 3
        }
      },{
        start: {
          line : currentPos.line,
          ch: currentPos.ch - 2
        },
        end: {
          line : currentPos.line,
          ch: currentPos.ch - 2
        }
      }]);
    }
  };

  var addEditMenu = function() {
    var editMenu = MenuManager.getMenu(MenuManager.AppMenuBar.EDIT_MENU);
    editMenu.addMenuItem(CONSOLE_AUTOCOMPLETER_EDIT_DEFAULT, "");
  };
  
  var loadPreferences = function() {
    params = getLocalStorage(preferencesKey);
    params = $.extend({}, fileParams, params);
    defaultText = params.defaultText || '';
  };
  
  var registerConsoleInfo = function() {
    CommandManager.register("Ctrl-Shift-x", CONSOLE_AUTOCOMPLETER_INFO, setLogInfo);
    KeyBindingManager.addBinding(CONSOLE_AUTOCOMPLETER_INFO, "Ctrl-Shift-x");
  };
  
  var registerConsoleLog = function() {
    CommandManager.register("Ctrl-Shift-v", CONSOLE_AUTOCOMPLETER_LOG, setLog);
    KeyBindingManager.addBinding(CONSOLE_AUTOCOMPLETER_LOG, "Ctrl-Shift-v");
  };
  
  var registerMenu = function(){
    CommandManager.register("Edit default log autocompleter text", CONSOLE_AUTOCOMPLETER_EDIT_DEFAULT, editPreferences);
    addEditMenu();
  }
  
  var editPreferences = function() {
    var inputValue;
    var dialog = DialogManager.showModalDialog(DialogManager.DIALOG_BTN_CLASS_NORMAL, 'Prueba', params.dialogHTML.replace('%p', defaultText));
    
    dialog.done(function() {
      inputValue = dialog.getElement()[0].querySelector('input').value || '';
      params.defaultText = inputValue;
      saveJSON();
      loadPreferences();
    });
  };
  
  var saveJSON = function() {
    saveLocalStorage(preferencesKey, {defaultText: params.defaultText});
  };
  
  var saveDefaultJSON = function() {
    saveLocalStorage(preferencesKey, {defaultText: fileParams.defaultText});
  };
  
  var saveLocalStorage = function(key, obj) {
    localStorage.setItem(key, JSON.stringify(obj));
  };
  
  var getLocalStorage = function(key) {
    return JSON.parse(localStorage.getItem(key) || '{defaultText: ""}');
  };
  
  var isFirstTime = function() {
    var defaultText = getLocalStorage(preferencesKey).defaultText || '';
    return defaultText<.defaultText.length === 0;
  };


  AppInit.appReady( function() {
    
    if(isFirstTime()){
      saveDefaultJSON();
    }
    loadPreferences();
    registerConsoleInfo();
    registerConsoleLog();
    registerMenu();
    
  } );

});
