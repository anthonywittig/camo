# camo

A code generation experiment. Some observations:

* There were times that I couldn't stop it from going in circles - "fix x" would break y, then "fix y" would break x...
* There were things that I couldn't explain clearly, so I broke down and edited a line of code (I think I only manually edited two lines, and I deleted some dumb comments).
* I didn't like some of the code style; my VSCode user settings do some formatting for TS, but I don't like some of the default styles. The AI had some conflicting style changes. I wonder if disabling auto formatting and just letting the AI do its thing would have been better for the AI.
* One of the refactors I tried to get it to do was to move the list of topics to a separate file. The refactoring started out ok (it deleted the lines I wanted to move), but it only copied over a few of the hundreds of lines to the new file.
* I think I moved quicker, but ended up with a lot of spaghetti code. Refactoring it wasn't too bad, but there are still lots of little things that bug me.
* I tried using Ollama, but the first few models I tried required more memory than I was giving the container. The one I tried wasn't great with my not-great prompting; it was also slow.
* I tried using Tesseract for OCR on images but I might have been doing something wrong as it wasn't working well with the pictures I was taking.
* TS was nice for finding errors... I imagine that if I was using Python or JS I'd have hit a lot of runtime errors.
