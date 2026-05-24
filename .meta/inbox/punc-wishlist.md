Getting a clear idea of the devex I want from the punc() function.

- type `punc()` to get a standard behavior punctuation mark.
    - Standard Behavior means:
        - If the clause is disabled, render nothing.
        - Else:
            - If the parent clause is the last active clause in the sentence, render a period
            - Else, render a comma

- type `punc({config})` to get a configurable punctuation mark.
    - Intuitively, I would like to be able to type something like
    ```typescript
        punc({
            display: (ctx) => {"this block returns a char, or in principle, anything},
            present: (ctx) => {"this block returns a boolean"}
        })
    ```