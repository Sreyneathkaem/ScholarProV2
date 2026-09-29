"use client";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Copy } from "lucide-react";
import {
  getVariablesByCategory,
  formatVariable,
} from "@/constants/email-variables";
import { VariableDefinition } from "@/types/email";
import { toast } from "sonner";

interface VariableSelectorProps {
  categoryId: string;
  onInsertVariable: (variableKey: string) => void;
}

export function VariableSelector({ onInsertVariable }: VariableSelectorProps) {
  const variables = getVariablesByCategory(); // Function doesn't use categoryId parameter

  // Group variables by category
  const recipientVars = variables.filter((v) => v.category === "recipient");
  const systemVars = variables.filter((v) => v.category === "system");
  const contextVars = variables.filter((v) => v.category === "context");

  const handleInsert = (variable: VariableDefinition) => {
    onInsertVariable(variable.key);
    toast.success(`Variable ${formatVariable(variable.key)} inserted`);
  };

  const VariableButton = ({ variable }: { variable: VariableDefinition }) => (
    <Button
      variant="outline"
      onClick={() => handleInsert(variable)}
      className="justify-start gap-2 h-auto py-2.5 text-left cursor-pointer w-full"
    >
      <Copy className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
      <code className="text-xs font-mono break-all">
        {formatVariable(variable.key)}
      </code>
    </Button>
  );

  const VariableInfo = ({ variable }: { variable: VariableDefinition }) => (
    <div className="flex flex-col gap-0.5">
      <Badge variant="outline" className="w-fit text-xs">
        {variable.display}
      </Badge>
      <span className="text-xs text-muted-foreground">{variable.description}</span>
      <span className="text-xs text-muted-foreground italic">
        Example: {variable.example}
      </span>
    </div>
  );

  return (
    <Card className="sticky top-4">
      <CardContent className="pt-6">
        <div className="space-y-4">
          <div>
            <h3 className="text-base font-semibold mb-2">
              Available Variables
            </h3>
            <p className="text-xs text-muted-foreground mb-4">
              Click to insert into your email template. These will be
              automatically replaced with actual data.
            </p>
          </div>

          {/* Recipient Variables */}
          {recipientVars.length > 0 && (
            <div>
              <h4 className="text-sm font-semibold mb-2 text-blue-700">
                Recipient Information
              </h4>
              <div className="flex flex-col gap-2">
                {recipientVars.map((variable) => (
                  <VariableButton key={variable.key} variable={variable} />
                ))}
              </div>
            </div>
          )}

          {/* System Variables */}
          {systemVars.length > 0 && (
            <div className="mt-4 pt-4 border-t">
              <h4 className="text-sm font-semibold mb-2 text-green-700">
                System Information
              </h4>
              <div className="flex flex-col gap-2">
                {systemVars.map((variable) => (
                  <VariableButton key={variable.key} variable={variable} />
                ))}
              </div>
            </div>
          )}

          {/* Context Variables */}
          {contextVars.length > 0 && (
            <div className="mt-4 pt-4 border-t">
              <h4 className="text-sm font-semibold mb-2 text-purple-700">
                Context-Specific
              </h4>
              <div className="flex flex-col gap-2">
                {contextVars.map((variable) => (
                  <VariableButton key={variable.key} variable={variable} />
                ))}
              </div>
            </div>
          )}

          {/* Variable Descriptions */}
          <div className="mt-4 pt-4 border-t">
            <h4 className="text-sm font-semibold mb-3">
              Variable Descriptions
            </h4>
            <div className="space-y-2.5 text-xs text-muted-foreground">
              {recipientVars.slice(0, 2).map((variable) => (
                <VariableInfo key={variable.key} variable={variable} />
              ))}
              {contextVars.length > 0 &&
                contextVars
                  .slice(0, 2)
                  .map((variable) => (
                    <VariableInfo key={variable.key} variable={variable} />
                  ))}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
