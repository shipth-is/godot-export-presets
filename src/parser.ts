/**
 * Parser for Godot config file format
 * Based on Godot's VariantParser implementation
 */

export class ParseError extends Error {
  constructor(message: string, public line: number) {
    super(`Parse error at line ${line}: ${message}`);
    this.name = "ParseError";
  }
}

type TokenType =
  | "STRING"
  | "NUMBER"
  | "BOOLEAN"
  | "IDENTIFIER"
  | "BRACKET_OPEN"
  | "BRACKET_CLOSE"
  | "PARENTHESIS_OPEN"
  | "PARENTHESIS_CLOSE"
  | "EQUAL"
  | "COMMA"
  | "SEMICOLON"
  | "HASH"
  | "EOF";

interface Token {
  type: TokenType;
  value: string | number | boolean;
  line: number;
}

class Stream {
  private pos = 0;
  private line = 1;
  private saved: string | null = null;

  constructor(private content: string) {}

  get_char(): string {
    if (this.saved !== null) {
      const c = this.saved;
      this.saved = null;
      return c;
    }
    if (this.pos >= this.content.length) {
      return "\0";
    }
    const c = this.content[this.pos++];
    if (c === "\n") {
      this.line++;
    }
    return c;
  }

  peek_char(): string {
    if (this.pos >= this.content.length) {
      return "\0";
    }
    return this.content[this.pos];
  }

  save_char(c: string): void {
    this.saved = c;
  }

  is_eof(): boolean {
    return this.pos >= this.content.length && this.saved === null;
  }

  get_line(): number {
    return this.line;
  }
}

function is_whitespace(c: string): boolean {
  return c === " " || c === "\t" || c === "\r" || c === "\n";
}

function is_digit(c: string): boolean {
  return c >= "0" && c <= "9";
}

function is_alpha(c: string): boolean {
  return (c >= "a" && c <= "z") || (c >= "A" && c <= "Z") || c === "_";
}

function is_alnum(c: string): boolean {
  return is_alpha(c) || is_digit(c);
}

function is_identifier_char(c: string): boolean {
  return is_alnum(c) || c === "/" || c === "." || c === "_" || c === "-";
}

function get_token(stream: Stream): Token {
  // Skip whitespace
  while (true) {
    const c = stream.peek_char();
    if (is_whitespace(c)) {
      stream.get_char();
      continue;
    }
    break;
  }

  const line = stream.get_line();
  const c = stream.get_char();

  if (c === "\0") {
    return { type: "EOF", value: "", line };
  }

  switch (c) {
    case "[":
      return { type: "BRACKET_OPEN", value: c, line };
    case "]":
      return { type: "BRACKET_CLOSE", value: c, line };
    case "(":
      return { type: "PARENTHESIS_OPEN", value: c, line };
    case ")":
      return { type: "PARENTHESIS_CLOSE", value: c, line };
    case "=":
      return { type: "EQUAL", value: c, line };
    case ",":
      return { type: "COMMA", value: c, line };
    case ";":
      // Comment - skip to end of line
      while (true) {
        const ch = stream.get_char();
        if (ch === "\n" || ch === "\0") {
          break;
        }
      }
      return get_token(stream); // Get next token after comment
    case "#":
      // Comment - skip to end of line
      while (true) {
        const ch = stream.get_char();
        if (ch === "\n" || ch === "\0") {
          break;
        }
      }
      return get_token(stream); // Get next token after comment
    case '"': {
      // String - supports multi-line strings
      let str = "";
      let escaped = false;
      while (true) {
        const ch = stream.get_char();
        if (ch === "\0") {
          throw new ParseError("Unterminated string", line);
        }
        if (escaped) {
          if (ch === "n") {
            str += "\n";
          } else if (ch === "t") {
            str += "\t";
          } else if (ch === "r") {
            str += "\r";
          } else if (ch === "\\") {
            str += "\\";
          } else if (ch === '"') {
            str += '"';
          } else {
            str += ch;
          }
          escaped = false;
        } else if (ch === "\\") {
          escaped = true;
        } else if (ch === '"') {
          // Check if this is the end of the string
          // Look ahead to see if there's whitespace, newline, EOF, or comment
          const peek = stream.peek_char();
          if (
            peek === "\0" ||
            peek === "\n" ||
            peek === "\r" ||
            peek === " " ||
            peek === "\t" ||
            peek === ";" ||
            peek === "#"
          ) {
            break;
          }
          // If followed by '=', it might be end of key (like "a=b"=value)
          // But if it's in the middle, it's part of the string
          // For now, assume it's the end if followed by whitespace/comment/newline
          break;
        } else {
          str += ch;
        }
      }
      return { type: "STRING", value: str, line };
    }
    default: {
      // Number, boolean, or identifier
      const peek = stream.peek_char();
      if (
        is_digit(c) ||
        (c === "-" && is_digit(peek)) ||
        (c === "+" && is_digit(peek)) ||
        (c === "." && is_digit(peek))
      ) {
        // Number - only start if we have a digit or sign followed by digit
        let numStr = c;
        let hasDot = c === ".";
        while (true) {
          const nextPeek = stream.peek_char();
          if (is_digit(nextPeek) || nextPeek === ".") {
            if (nextPeek === ".") {
              if (hasDot) break;
              hasDot = true;
            }
            numStr += stream.get_char();
          } else {
            break;
          }
        }
        const num = parseFloat(numStr);
        if (isNaN(num)) {
          throw new ParseError(`Invalid number: ${numStr}`, line);
        }
        return { type: "NUMBER", value: num, line };
      } else if (is_alpha(c) || c === "/") {
        // Identifier or boolean
        let ident = c;
        while (true) {
          const peek = stream.peek_char();
          if (is_identifier_char(peek)) {
            ident += stream.get_char();
          } else {
            break;
          }
        }
        if (ident === "true") {
          return { type: "BOOLEAN", value: true, line };
        } else if (ident === "false") {
          return { type: "BOOLEAN", value: false, line };
        }
        return { type: "IDENTIFIER", value: ident, line };
      } else {
        throw new ParseError(`Unexpected character: ${c}`, line);
      }
    }
  }
}

function parse_construct_args(stream: Stream): number[] {
  const args: number[] = [];
  let token = get_token(stream);

  if (token.type !== "PARENTHESIS_OPEN") {
    throw new ParseError("Expected '(' in constructor", token.line);
  }

  let first = true;
  while (true) {
    if (!first) {
      token = get_token(stream);
      if (token.type === "COMMA") {
        // Continue
      } else if (token.type === "PARENTHESIS_CLOSE") {
        break;
      } else {
        throw new ParseError("Expected ',' or ')' in constructor", token.line);
      }
    }

    token = get_token(stream);
    if (first && token.type === "PARENTHESIS_CLOSE") {
      break;
    }

    if (token.type === "NUMBER") {
      args.push(token.value as number);
    } else if (token.type === "IDENTIFIER") {
      // Try to parse as number (e.g., "inf", "nan")
      const ident = token.value as string;
      if (ident === "inf" || ident === "Infinity") {
        args.push(Infinity);
      } else if (ident === "-inf" || ident === "-Infinity") {
        args.push(-Infinity);
      } else if (ident === "nan" || ident === "NaN") {
        args.push(NaN);
      } else {
        throw new ParseError(`Expected number in constructor, got: ${ident}`, token.line);
      }
    } else {
      throw new ParseError("Expected number in constructor", token.line);
    }
    first = false;
  }

  return args;
}

function parse_value(stream: Stream): unknown {
  const token = get_token(stream);

  switch (token.type) {
    case "STRING":
      return token.value;
    case "NUMBER":
      return token.value;
    case "BOOLEAN":
      return token.value;
    case "IDENTIFIER": {
      const ident = token.value as string;
      if (ident === "Color") {
        const args = parse_construct_args(stream);
        if (args.length !== 4) {
          throw new ParseError("Expected 4 arguments for Color constructor", token.line);
        }
        return { r: args[0], g: args[1], b: args[2], a: args[3] };
      } else if (ident === "Vector2") {
        const args = parse_construct_args(stream);
        if (args.length !== 2) {
          throw new ParseError("Expected 2 arguments for Vector2 constructor", token.line);
        }
        return { x: args[0], y: args[1] };
      } else {
        throw new ParseError(`Unknown identifier: ${ident}`, token.line);
      }
    }
    default:
      throw new ParseError(`Unexpected token type: ${token.type}`, token.line);
  }
}

export function parse_config(content: string): {
  values: Map<string, Map<string, unknown>>;
  error?: Error;
} {
  const values = new Map<string, Map<string, unknown>>();
  const stream = new Stream(content);
  let currentSection = "";

  try {
    while (true) {
      // Skip whitespace
      while (true) {
        const peek = stream.peek_char();
        if (is_whitespace(peek)) {
          stream.get_char();
          continue;
        }
        break;
      }

      const token = get_token(stream);
      if (token.type === "EOF") {
        break;
      }

      if (token.type === "BRACKET_OPEN") {
        // Parse section name
        const sectionToken = get_token(stream);
        if (sectionToken.type !== "IDENTIFIER" && sectionToken.type !== "STRING") {
          throw new ParseError("Expected section name", sectionToken.line);
        }
        let sectionName = String(sectionToken.value);
        const closeToken = get_token(stream);
        if (closeToken.type === "BRACKET_CLOSE") {
          // Handle escaped brackets
          sectionName = sectionName.replace(/\\\]/g, "]");
          currentSection = sectionName;
          if (!values.has(currentSection)) {
            values.set(currentSection, new Map());
          }
        } else {
          throw new ParseError("Expected ']' after section name", closeToken.line);
        }
      } else if (token.type === "IDENTIFIER" || token.type === "STRING") {
        // Key-value pair - key can be identifier or quoted string
        const key = String(token.value);
        const equalToken = get_token(stream);
        if (equalToken.type !== "EQUAL") {
          throw new ParseError("Expected '=' after key", equalToken.line);
        }
        const value = parse_value(stream);

        if (!values.has(currentSection)) {
          values.set(currentSection, new Map());
        }
        values.get(currentSection)!.set(key, value);
      } else if (token.type === "BRACKET_CLOSE") {
        throw new ParseError("Unexpected ']'", token.line);
      }
    }
  } catch (error) {
    if (error instanceof ParseError) {
      return { values, error };
    }
    throw error;
  }

  return { values };
}

