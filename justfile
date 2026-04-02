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

publish:
    {{pelican}} {{input}} -o {{dist}} -s {{pubconf}}

clean:
    rm -rf {{dist}}

clean-all: clean
    rm -rf {{input}}
