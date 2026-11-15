# PLANETDLE launch and sharing

## Launch on Windows, macOS, or Linux

1. Extract the ZIP and open a terminal inside the extracted `planetdle` folder.
2. Run `python -m pip install -r requirements.txt`.
3. Run `python serve.py`.
4. Visit [PLANETDLE](http://127.0.0.1:5000/). Keep the terminal open while playing. All core assets are included. The optional NASA photo gallery needs internet access.

## Public test deployment

Suggested destination: one [Render Python Web Service](https://render.com/docs/deploy-flask) backed by a repository you control. A running Python service is required for game sessions and API routes.

- Put the extracted `planetdle` files at the repository root. Set **Build Command** to `python -m pip install -r requirements.txt` and **Start Command** to `python serve.py`.
- Set **Health Check Path** to `/api/health`.
- Set `PLANETDLE_HOST` to `0.0.0.0`, `PLANETDLE_HTTPS` to `1`, and set `PLANETDLE_SECRET_KEY` as a randomly generated secret in the host dashboard. Leave Render to provide `PORT`. Keep secrets out of the repository.
- Use one service instance. Round state is held in that process with a 200-session cap. A restart, redeploy, or session eviction clears its active rounds. The daily selection uses the server's calendar date.
- After deployment, test the assigned HTTPS URL in a fresh browser, including a full guess, reload, Locate and a texture. Use a separate network to verify access before sharing.

This ZIP was prepared for the above settings. Public deployment awaits confirmation of the destination and public visibility, plus access to that hosting account and its repository.
