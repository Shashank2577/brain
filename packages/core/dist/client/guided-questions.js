import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { IconCheck, IconChevronRight, IconHelpCircle, IconUpload, IconX, } from "@tabler/icons-react";
import { agentNativePath } from "./api-path.js";
import { sendToAgentChat } from "./agent-chat.js";
import { cn } from "./utils.js";
const OTHER_OPTION_PREFIX = "__other__:";
const EXPLORE_OPTION = {
    label: "Explore a few options",
    value: "__explore__",
    description: "Show me a few distinct directions before committing.",
};
const DECIDE_OPTION = {
    label: "Decide for me",
    value: "__decide__",
    description: "Use your judgment and keep moving.",
};
function isFileLike(value) {
    return (typeof value === "object" &&
        value !== null &&
        "name" in value &&
        typeof value.name === "string");
}
export function isOtherGuidedAnswer(value) {
    return typeof value === "string" && value.startsWith(OTHER_OPTION_PREFIX);
}
export function getOtherGuidedAnswerText(value) {
    return isOtherGuidedAnswer(value)
        ? value.slice(OTHER_OPTION_PREFIX.length)
        : "";
}
export function makeOtherGuidedAnswer(text = "") {
    return `${OTHER_OPTION_PREFIX}${text}`;
}
export function hasGuidedAnswer(value) {
    if (value == null || value === "")
        return false;
    if (Array.isArray(value))
        return value.some(hasGuidedAnswer);
    if (isOtherGuidedAnswer(value)) {
        return getOtherGuidedAnswerText(value).trim().length > 0;
    }
    return true;
}
export function formatGuidedAnswerValue(value) {
    if (Array.isArray(value)) {
        return value.map(formatGuidedAnswerValue).filter(hasGuidedAnswer);
    }
    if (isOtherGuidedAnswer(value)) {
        const text = getOtherGuidedAnswerText(value).trim();
        return text ? `Other: ${text}` : "";
    }
    if (isFileLike(value))
        return value.name;
    return value;
}
export function normalizeGuidedAnswers(answers) {
    return Object.fromEntries(Object.entries(answers).map(([id, value]) => [
        id,
        formatGuidedAnswerValue(value),
    ]));
}
export function formatGuidedAnswersForAgent(answers) {
    return Object.entries(normalizeGuidedAnswers(answers))
        .filter(([, value]) => hasGuidedAnswer(value))
        .map(([id, value]) => {
        if (Array.isArray(value))
            return `${id}: ${value.join(", ")}`;
        return `${id}: ${String(value)}`;
    })
        .join("\n");
}
function optionKey(option) {
    return `${option.value.toLowerCase()}::${option.label.toLowerCase()}`;
}
function withDefaultOptions(question) {
    const base = question.options ?? question.choices ?? [];
    const seen = new Set(base.map(optionKey));
    const result = [...base];
    const maybePush = (option, enabled) => {
        if (!enabled)
            return;
        const key = optionKey(option);
        const label = option.label.toLowerCase();
        const value = option.value.toLowerCase();
        const duplicate = result.some((existing) => optionKey(existing) === key ||
            existing.label.toLowerCase() === label ||
            existing.value.toLowerCase() === value);
        if (duplicate || seen.has(key))
            return;
        seen.add(key);
        result.push(option);
    };
    maybePush(EXPLORE_OPTION, question.includeExplore !== false);
    maybePush(DECIDE_OPTION, question.includeDecide !== false);
    return result;
}
export function GuidedQuestionFlow({ questions, onSubmit, onSkip, title = "A few choices before I generate", description = "Pick what you know. Use Other for anything that does not fit, or let the agent decide.", skipLabel = "Skip", submitLabel = "Continue", className, }) {
    const [answers, setAnswers] = useState({});
    useEffect(() => {
        setAnswers({});
    }, [questions]);
    const setAnswer = useCallback((id, value) => {
        setAnswers((prev) => ({ ...prev, [id]: value }));
    }, []);
    const allRequiredAnswered = questions
        .filter((question) => question.required)
        .every((question) => hasGuidedAnswer(answers[question.id]));
    return (_jsx("div", { className: cn("flex h-full w-full items-center justify-center bg-background text-foreground", className), children: _jsxs("div", { className: "flex max-h-full w-full max-w-3xl flex-col px-4 py-6 sm:px-8 sm:py-10", children: [_jsxs("div", { className: "mb-6 flex items-start gap-3", children: [_jsx("div", { className: "mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-md border border-border bg-muted/40 text-primary", children: _jsx(IconHelpCircle, { className: "h-5 w-5" }) }), _jsxs("div", { className: "min-w-0", children: [_jsx("h2", { className: "text-xl font-semibold tracking-normal text-foreground sm:text-2xl", children: title }), description && (_jsx("p", { className: "mt-1 max-w-2xl text-sm leading-5 text-muted-foreground", children: description }))] })] }), _jsx("div", { className: "min-h-0 flex-1 space-y-4 overflow-y-auto pr-1", children: questions.map((question, index) => (_jsx(QuestionCard, { index: index, question: question, value: answers[question.id], onChange: (value) => setAnswer(question.id, value) }, question.id))) }), _jsxs("div", { className: "mt-5 flex shrink-0 items-center justify-between gap-4 border-t border-border pt-4", children: [_jsx("div", { className: "flex items-center gap-1.5", children: questions.map((question, index) => (_jsx("span", { className: cn("h-1.5 w-1.5 rounded-full", hasGuidedAnswer(answers[question.id])
                                    ? "bg-primary"
                                    : "bg-muted-foreground/30") }, question.id || index))) }), _jsxs("div", { className: "flex items-center gap-2", children: [_jsx("button", { type: "button", onClick: onSkip, className: "cursor-pointer rounded-md px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-muted/60 hover:text-foreground", children: skipLabel }), _jsxs("button", { type: "button", onClick: () => onSubmit(normalizeGuidedAnswers(answers)), disabled: !allRequiredAnswered, className: "inline-flex cursor-pointer items-center gap-2 rounded-md bg-primary px-3.5 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-45", children: [submitLabel, _jsx(IconChevronRight, { className: "h-4 w-4" })] })] })] })] }) }));
}
function QuestionCard({ index, question, value, onChange, }) {
    return (_jsxs("section", { className: "rounded-lg border border-border bg-card/65 p-4 shadow-sm", children: [_jsxs("div", { className: "mb-3 flex gap-3", children: [_jsx("div", { className: "flex h-6 min-w-6 items-center justify-center rounded-md bg-muted text-xs font-medium text-muted-foreground", children: index + 1 }), _jsxs("div", { className: "min-w-0", children: [question.header && (_jsx("p", { className: "mb-1 text-[11px] font-medium uppercase text-muted-foreground", children: question.header })), _jsxs("h3", { className: "text-sm font-medium leading-5 text-foreground", children: [question.question, question.required && (_jsx("span", { className: "ml-1 text-destructive", children: "*" }))] }), question.description && (_jsx("p", { className: "mt-1 text-xs leading-5 text-muted-foreground", children: question.description }))] })] }), question.type === "text-options" && (_jsx(TextOptions, { question: question, value: value, onChange: onChange })), question.type === "color-options" && (_jsx(ColorOptions, { question: question, value: value, onChange: onChange })), question.type === "slider" && (_jsx(SliderQuestion, { question: question, value: value, onChange: onChange })), question.type === "file" && (_jsx(FileDropZone, { value: value, onChange: onChange })), question.type === "freeform" && (_jsx("textarea", { value: typeof value === "string" ? value : "", onChange: (event) => onChange(event.target.value), placeholder: question.placeholder ?? "Type your answer...", className: "min-h-[84px] w-full resize-none rounded-md border border-border bg-muted/45 px-3 py-2 text-sm text-foreground outline-none placeholder:text-muted-foreground/70 focus:border-primary" }))] }));
}
function TextOptions({ question, value, onChange, }) {
    const options = useMemo(() => withDefaultOptions(question), [question]);
    const multiSelect = question.multiSelect === true;
    const selectedValues = Array.isArray(value) ? value : [];
    const otherSelected = multiSelect
        ? selectedValues.some(isOtherGuidedAnswer)
        : isOtherGuidedAnswer(value);
    const otherText = multiSelect
        ? getOtherGuidedAnswerText(selectedValues.find(isOtherGuidedAnswer))
        : getOtherGuidedAnswerText(value);
    const isSelected = (optionValue) => multiSelect ? selectedValues.includes(optionValue) : value === optionValue;
    const toggleOption = (optionValue) => {
        if (!multiSelect) {
            onChange(optionValue);
            return;
        }
        const next = selectedValues.includes(optionValue)
            ? selectedValues.filter((item) => item !== optionValue)
            : [...selectedValues, optionValue];
        onChange(next);
    };
    const toggleOther = () => {
        if (!multiSelect) {
            onChange(otherSelected ? "" : makeOtherGuidedAnswer());
            return;
        }
        if (otherSelected) {
            onChange(selectedValues.filter((item) => !isOtherGuidedAnswer(item)));
            return;
        }
        onChange([...selectedValues, makeOtherGuidedAnswer()]);
    };
    const setOtherText = (text) => {
        const nextOther = makeOtherGuidedAnswer(text);
        if (!multiSelect) {
            onChange(nextOther);
            return;
        }
        onChange([
            ...selectedValues.filter((item) => !isOtherGuidedAnswer(item)),
            nextOther,
        ]);
    };
    const allowOther = question.allowOther !== false;
    return (_jsxs("div", { className: "space-y-3", children: [_jsxs("div", { className: "grid gap-2 sm:grid-cols-2", children: [options.map((option) => (_jsx(OptionButton, { option: option, selected: isSelected(option.value), multiSelect: multiSelect, onClick: () => toggleOption(option.value) }, `${option.value}:${option.label}`))), allowOther && (_jsx(OptionButton, { option: {
                            label: "Other...",
                            value: "__other__",
                            description: "Tell the agent exactly what you mean.",
                        }, selected: otherSelected, multiSelect: multiSelect, onClick: toggleOther }))] }), allowOther && otherSelected && (_jsx("textarea", { autoFocus: true, value: otherText, onChange: (event) => setOtherText(event.target.value), placeholder: question.placeholder ?? "Type a custom answer...", className: "min-h-[72px] w-full resize-none rounded-md border border-border bg-muted/45 px-3 py-2 text-sm text-foreground outline-none placeholder:text-muted-foreground/70 focus:border-primary" }))] }));
}
function OptionButton({ option, selected, multiSelect, onClick, }) {
    return (_jsxs("button", { type: "button", onClick: onClick, className: cn("group flex min-h-[56px] cursor-pointer items-start gap-2 rounded-md border px-3 py-2 text-left transition-colors", selected
            ? "border-primary bg-primary/10 text-primary"
            : "border-border bg-muted/30 text-muted-foreground hover:border-muted-foreground/50 hover:bg-muted/45 hover:text-foreground"), children: [multiSelect && (_jsx("span", { className: cn("mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded border", selected ? "border-primary bg-primary text-primary-foreground" : ""), children: selected && _jsx(IconCheck, { className: "h-3 w-3" }) })), _jsxs("span", { className: "min-w-0 flex-1", children: [_jsxs("span", { className: "flex flex-wrap items-center gap-1.5 text-sm font-medium leading-5", children: [option.label, option.recommended && (_jsx("span", { className: "rounded-sm bg-primary/15 px-1.5 py-0.5 text-[10px] font-medium uppercase text-primary", children: "Recommended" }))] }), option.description && (_jsx("span", { className: "mt-0.5 block text-xs leading-4 text-muted-foreground", children: option.description }))] })] }));
}
function ColorOptions({ question, value, onChange, }) {
    const options = question.options ?? question.choices ?? [];
    const multiSelect = question.multiSelect === true;
    const selectedValues = Array.isArray(value) ? value : [];
    const isSelected = (optionValue) => multiSelect ? selectedValues.includes(optionValue) : value === optionValue;
    const toggleOption = (optionValue) => {
        if (!multiSelect) {
            onChange(optionValue);
            return;
        }
        onChange(selectedValues.includes(optionValue)
            ? selectedValues.filter((item) => item !== optionValue)
            : [...selectedValues, optionValue]);
    };
    return (_jsx("div", { className: "flex flex-wrap gap-3", children: options.map((option) => {
            const selected = isSelected(option.value);
            return (_jsxs("button", { type: "button", onClick: () => toggleOption(option.value), className: "group flex cursor-pointer flex-col items-center gap-1.5", children: [_jsx("span", { className: cn("h-10 w-10 rounded-full", selected
                            ? "ring-2 ring-primary ring-offset-2 ring-offset-background"
                            : "ring-1 ring-border group-hover:ring-muted-foreground/50"), style: { backgroundColor: option.color || option.value } }), _jsx("span", { className: cn("max-w-20 truncate text-[10px]", selected ? "text-foreground" : "text-muted-foreground"), children: option.label })] }, `${option.value}:${option.label}`));
        }) }));
}
function SliderQuestion({ question, value, onChange, }) {
    const min = question.min ?? 0;
    const max = question.max ?? 100;
    const step = question.step ?? 1;
    const current = typeof value === "number" ? value : Math.round((min + max) / 2);
    return (_jsxs("div", { className: "flex items-center gap-4", children: [_jsx("span", { className: "w-8 text-xs text-muted-foreground", children: min }), _jsx("input", { type: "range", min: min, max: max, step: step, value: current, onChange: (event) => onChange(Number(event.target.value)), className: "h-2 flex-1 cursor-pointer accent-primary" }), _jsx("span", { className: "w-8 text-right text-xs text-muted-foreground", children: max }), _jsx("span", { className: "min-w-10 text-right text-sm font-medium tabular-nums text-foreground", children: current })] }));
}
function FileDropZone({ value, onChange, }) {
    const [dragOver, setDragOver] = useState(false);
    const files = Array.isArray(value) ? value : [];
    const addFiles = (incoming) => onChange([...files, ...incoming]);
    const removeFile = (index) => onChange(files.filter((_, fileIndex) => fileIndex !== index));
    return (_jsxs("div", { children: [_jsxs("div", { onDragOver: (event) => {
                    event.preventDefault();
                    setDragOver(true);
                }, onDragLeave: () => setDragOver(false), onDrop: (event) => {
                    event.preventDefault();
                    setDragOver(false);
                    addFiles(Array.from(event.dataTransfer.files));
                }, className: cn("flex cursor-pointer flex-col items-center justify-center rounded-md border-2 border-dashed p-5 transition-colors", dragOver
                    ? "border-primary bg-primary/5"
                    : "border-border bg-muted/30 hover:border-muted-foreground/50"), children: [_jsx(IconUpload, { className: "mb-2 h-5 w-5 text-muted-foreground" }), _jsxs("p", { className: "text-sm text-muted-foreground", children: ["Drag files here or", " ", _jsxs("label", { className: "cursor-pointer text-primary hover:underline", children: ["browse", _jsx("input", { type: "file", multiple: true, onChange: (event) => {
                                            if (event.target.files)
                                                addFiles(Array.from(event.target.files));
                                            event.currentTarget.value = "";
                                        }, className: "hidden" })] })] })] }), files.length > 0 && (_jsx("div", { className: "mt-2 space-y-1", children: files.map((file, index) => (_jsxs("div", { className: "flex items-center gap-2 rounded-md bg-muted/50 px-2 py-1 text-xs text-muted-foreground", children: [_jsx(IconCheck, { className: "h-3 w-3 text-primary" }), _jsx("span", { className: "min-w-0 flex-1 truncate", children: file.name }), _jsx("button", { type: "button", onClick: () => removeFile(index), className: "cursor-pointer text-muted-foreground/70 hover:text-foreground", "aria-label": `Remove ${file.name}`, children: _jsx(IconX, { className: "h-3 w-3" }) })] }, `${file.name}:${index}`))) }))] }));
}
export function useGuidedQuestionFlow({ stateKey = "show-questions", queryKey = ["show-questions"], refetchInterval = 2_000, submitMessage = "Here are my answers — go ahead.", skipMessage = "Skip the questions — decide for me.", buildSubmitContext, buildSkipContext, } = {}) {
    const queryClient = useQueryClient();
    const [payload, setPayload] = useState(null);
    const endpoint = agentNativePath(`/_agent-native/application-state/${stateKey}`);
    const { data } = useQuery({
        queryKey,
        queryFn: async () => {
            const res = await fetch(endpoint);
            if (!res.ok)
                return null;
            const text = await res.text();
            if (!text)
                return null;
            try {
                const parsed = JSON.parse(text);
                if (Array.isArray(parsed?.questions) && parsed.questions.length > 0) {
                    return { ...parsed, _ts: Date.now() };
                }
            }
            catch {
                return null;
            }
            return null;
        },
        refetchInterval,
        structuralSharing: false,
    });
    useEffect(() => {
        if (Array.isArray(data?.questions) && data.questions.length > 0) {
            setPayload(data);
        }
        else {
            setPayload(null);
        }
    }, [data]);
    const clear = useCallback(() => {
        setPayload(null);
        queryClient.setQueryData(queryKey, null);
        fetch(endpoint, {
            method: "DELETE",
            headers: { "X-Agent-Native-CSRF": "1" },
        }).catch(() => { });
    }, [endpoint, queryClient, queryKey]);
    const handleSubmit = useCallback((answers) => {
        const formattedAnswers = formatGuidedAnswersForAgent(answers);
        const context = buildSubmitContext?.({ answers, formattedAnswers }) ??
            [
                "The user answered the pre-generation questions.",
                "",
                "Answers:",
                formattedAnswers,
            ].join("\n");
        sendToAgentChat({ message: submitMessage, context, submit: true });
        clear();
    }, [buildSubmitContext, clear, submitMessage]);
    const handleSkip = useCallback(() => {
        sendToAgentChat({
            message: skipMessage,
            context: buildSkipContext?.(),
            submit: true,
        });
        clear();
    }, [buildSkipContext, clear, skipMessage]);
    return {
        payload,
        questions: payload?.questions ?? null,
        title: payload?.title,
        description: payload?.description,
        skipLabel: payload?.skipLabel,
        submitLabel: payload?.submitLabel,
        clear,
        handleSubmit,
        handleSkip,
    };
}
//# sourceMappingURL=guided-questions.js.map