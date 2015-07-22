define(function(require, exports, module) {

    var CommandManager = brackets.getModule("command/CommandManager"),
            Menus = brackets.getModule("command/Menus"),
            AppInit = brackets.getModule("utils/AppInit");
    var DocumentManager = brackets.getModule("document/DocumentManager");
  	var KeyBindingManager = brackets.getModule('command/KeyBindingManager');

  
    var currentDoc;
    var EditorManager;
    var editor;
    var positionsBack = 0;
  
    var CONSOLE_LOG = "console.log('%w', %w);";
  
    
  
    var getWordInPosition = function (line, cursorColumn){
      var words;
      var lastWord;
      var lastIndex = 1;
      
      line = line.substring(0, cursorColumn);
      words = line.split(/\W/);
      
      return getLastWord();
      
      function getLastWord(){
        lastWord = words[words.length - lastIndex];
        if(!lastWord){
          lastIndex++;
          positionsBack = lastIndex-1;
          lastWord = getLastWord();
        }
        
        return lastWord;
        
      }
    };
  
    var addConsoleLog = function (){
      var currentPos;
      var line;
      var word;
      var startPosition;
            
      getEditor();
      getPosition();
      getWord();
      getWordStartPosition();
      replaceWord();
      
      function getEditor(){
        currentDoc = DocumentManager.getCurrentDocument();
        EditorManager = brackets.getModule("editor/EditorManager");
        editor = EditorManager.getCurrentFullEditor();
      };
      
      function getPosition(){
        currentPos = editor.getCursorPos();
      };
      
      function getWord(){
        line = editor.document.getLine(currentPos.line);
        word = getWordInPosition(line, currentPos.ch);
      };
      
      function getWordStartPosition(){
        startPosition = {
          line: currentPos.line,
          ch: currentPos.ch - word.length - positionsBack
        }; 
      };
      
      function replaceWord(){
        var cLog = CONSOLE_LOG.replace(/\%w/g, word);
        var pos = editor.getSelection();
        
        currentDoc.replaceRange(cLog, startPosition, pos.end);
      };
    };

    AppInit.appReady(function () {

        var CONSOLEAUTOCOMPLETER = "console.log.autocompleter";

        CommandManager.register("Ctrl-Shift-v", CONSOLEAUTOCOMPLETER, addConsoleLog);
        KeyBindingManager.addBinding(CONSOLEAUTOCOMPLETER, "Ctrl-Shift-v");
    });

});