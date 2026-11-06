<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

- Deposit minimums and client-side withdrawal eligibility use `src/lib/funding-rules.ts` for display consistency; the database RPCs remain authoritative. Visitor-language defaults use the Cloudflare country header through a server function, while a saved language takes priority.
