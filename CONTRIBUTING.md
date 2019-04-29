# Bug Reports

You can file issues here on GitHub. Please try to include as much
information as you can and under what conditions you saw the issue.

## Sending Pull Requests

Patches should be submitted as pull requests. When submitting patches as PRs:

- For any non-trivial patch, please file an issue to achieve consensus about goal and implementation first.
- You agree to license your code under the project's open source license ([MPL 2.0](/LICENSE)).
- Base your branch off the current `master` (see below for an example workflow).
- Add both your code and new tests if relevant.
- Run `npm test` to make sure all tests still pass.
- Please do not include merge commits in pull requests; include only commits with the new relevant code.

See the main [README.md](/README.md) for information on prerequisites, installing, running and testing.

## Example Workflow

This is an example workflow to make it easier to submit Pull Requests. Imagine your username is `user1`:

1. Fork this repository via the GitHub interface

2. The clone the upstream (as origin) and add your own repo as a remote:

    ```sh
    $ git clone git://github.com/mozilla/srihash.org.git
    $ cd srihash.org
    $ git remote add user1 git@github.com:user1/srihash.org.git
    ```

3. Create a branch for your fix/feature and make sure it's your currently checked-out branch:

    ```sh
    $ git checkout -b add-new-feature
    ```

4. Add/fix code, add tests then commit and push this branch to your repo:

    ```sh
    $ git add <files...>
    $ git commit
    $ git push user1 add-new-feature
    ```

5. From the GitHub interface for your repo, click the `Review Changes and Pull Request` which appears next to your new branch.

6. Click `Send pull request`.

### Keeping up to Date

The main reason for creating a new branch for each feature or fix is so that you can track master correctly. If you need
to fetch the latest code for a new fix, try the following:

```sh
$ git checkout master
$ git pull
```

Now you're ready to branch again for your new feature (from step 3 above).
