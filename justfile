py      := "python3"
pelican := "pelican"

input   := "content"
dist    := "dist"
conf    := "pelicanconf.py"
pubconf := "publishconf.py"

sync:
    {{py}} sync_vault.py

html:
    {{pelican}} {{input}} -o {{dist}} -s {{conf}}

sync-html: sync html

devserver:
    {{pelican}} -lr {{input}} -o {{dist}} -s {{conf}}

publish: clean-all sync
    {{pelican}} {{input}} -o {{dist}} -s {{pubconf}}

deploy: publish
    pnpm exec wrangler pages deploy {{dist}}

clean:
    rm -rf {{dist}}

clean-all: clean
    rm -rf {{input}}
