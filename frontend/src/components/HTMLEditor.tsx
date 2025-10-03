import React, { useRef, useEffect } from 'react';
import { Editor } from '@monaco-editor/react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Eye, Code, Maximize2, Minimize2, RotateCcw } from 'lucide-react';
import { useState } from 'react';

interface HTMLEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  height?: number;
}

const HTMLEditor: React.FC<HTMLEditorProps> = ({
  value,
  onChange,
  placeholder = "",
  height = 400
}) => {
  const [isPreviewMode, setIsPreviewMode] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [editorHeight, setEditorHeight] = useState(height);
  const editorRef = useRef<any>(null);

  const handleEditorDidMount = (editor: any, monaco: any) => {
    editorRef.current = editor;
    
    // Configure editor options
    editor.updateOptions({
      minimap: { enabled: false },
      scrollBeyondLastLine: false,
      wordWrap: 'on',
      automaticLayout: true,
      tabSize: 2,
      insertSpaces: true,
      fontSize: 14,
      lineNumbers: 'on',
      folding: true,
      bracketPairColorization: { enabled: true },
      guides: {
        indentation: true,
        bracketPairs: true
      }
    });
  };

  const handleEditorChange = (value: string | undefined) => {
    if (value !== undefined) {
      onChange(value);
    }
  };

  const toggleFullscreen = () => {
    const newFullscreen = !isFullscreen;
    setIsFullscreen(newFullscreen);
    setEditorHeight(newFullscreen ? window.innerHeight - 120 : height);
  };

  const resetEditor = () => {
    onChange('');
  };

  return (
    <div className={`${isFullscreen ? 'fixed inset-0 z-50 bg-white flex flex-col' : ''}`}>
      <Card className={`${isFullscreen ? 'h-full flex flex-col' : ''}`}>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">HTML Editor</CardTitle>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={resetEditor}
                className="flex items-center gap-1"
              >
                <RotateCcw className="w-4 h-4" />
                Clear
              </Button>
              
            </div>
          </div>
        </CardHeader>
        <CardContent className={`p-0 ${isFullscreen ? 'flex-1 flex flex-col' : ''}`}>
          <Tabs value={isPreviewMode ? "preview" : "code"} className={`w-full ${isFullscreen ? 'flex-1 flex flex-col' : ''}`}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger 
                value="code" 
                onClick={() => setIsPreviewMode(false)}
                className="flex items-center gap-2"
              >
                <Code className="w-4 h-4" />
                Code
              </TabsTrigger>
              <TabsTrigger 
                value="preview" 
                onClick={() => setIsPreviewMode(true)}
                className="flex items-center gap-2"
              >
                <Eye className="w-4 h-4" />
                Preview
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="code" className={`mt-0 ${isFullscreen ? 'flex-1 flex flex-col' : ''}`}>
              <div style={{ height: editorHeight }} className={isFullscreen ? 'flex-1' : ''}>
                <Editor
                  height={isFullscreen ? '100%' : editorHeight}
                  defaultLanguage="html"
                  value={value || placeholder}
                  onChange={handleEditorChange}
                  onMount={handleEditorDidMount}
                  theme="vs-light"
                  options={{
                    selectOnLineNumbers: true,
                    roundedSelection: false,
                    readOnly: false,
                    cursorStyle: 'line',
                    automaticLayout: true,
                    wordWrap: 'on',
                    lineNumbers: 'on',
                    minimap: { enabled: false },
                    scrollBeyondLastLine: false,
                    fontSize: 14,
                    tabSize: 2,
                    insertSpaces: true,
                    folding: true,
                    bracketPairColorization: { enabled: true },
                    guides: {
                      indentation: true,
                      bracketPairs: true
                    }
                  }}
                />
              </div>
            </TabsContent>
            
            <TabsContent value="preview" className={`mt-0 ${isFullscreen ? 'flex-1 flex flex-col' : ''}`}>
              <div 
                className={`border rounded-lg p-4 bg-white overflow-auto ${isFullscreen ? 'flex-1' : ''}`}
                style={{ height: editorHeight }}
              >
                {value ? (
                  <div 
                    dangerouslySetInnerHTML={{ __html: value }}
                    style={{ 
                      fontFamily: 'Arial, sans-serif',
                      lineHeight: '1.6',
                      color: '#333'
                    }}
                  />
                ) : (
                  <div className="text-gray-500 text-center py-8">
                    <Eye className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>No HTML content to preview</p>
                    <p className="text-sm">Switch to Code tab to start editing</p>
                  </div>
                )}
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default HTMLEditor;
