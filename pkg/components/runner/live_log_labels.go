package runner

import "strings"

const (
	LiveLogKindBash       = "bash"
	LiveLogKindPrompt     = "prompt"
	LiveLogKindSetup      = "setup"
	LiveLogKindJavaScript = "javascript"
	LiveLogKindPython     = "python"

	liveLogPreviewMaxRunes = 2048
)

// LiveLogPreview is the full user-facing command or prompt text, with only its
// outer whitespace trimmed. Internal newlines are preserved so the UI can
// render the complete body, wrapped. The rune cap only bounds a very large
// body.
func LiveLogPreview(text string) string {
	trimmed := strings.TrimSpace(text)
	runes := []rune(trimmed)
	if len(runes) > liveLogPreviewMaxRunes {
		return string(runes[:liveLogPreviewMaxRunes])
	}
	return trimmed
}
