AUTHOR = "Ram"
SITENAME = "ninjamar.dev"
SITEURL = ""

PATH = "content"

TIMEZONE = "Asia/Singapore"

DEFAULT_LANG = "en"

# Feed generation is usually not desired when developing
FEED_ALL_ATOM = None
CATEGORY_FEED_ATOM = None
TRANSLATION_FEED_ATOM = None
AUTHOR_FEED_ATOM = None
AUTHOR_FEED_RSS = None

# Blogroll
"""
LINKS = (
    ("Pelican", "https://getpelican.com/"),
    ("Python.org", "https://www.python.org/"),
    ("Jinja2", "https://palletsprojects.com/p/jinja/"),
    ("You can modify those links in your config file", "#"),
)

# Social widget
SOCIAL = (
    ("You can add links in your config file", "#"),
    ("Another social link", "#"),
)
"""
DEFAULT_PAGINATION = 10

# Uncomment following line if you want document-relative URLs when developing
# RELATIVE_URLS = True
# THEME_STATIC_PATHS = ['static']
THEME_STATIC_DIR = "static/"
THEME = "theme"
PLUGIN_PATHS = ["plugins"]
PLUGINS = ["photos_from_dir", "mistune_reader", "projects_reader"]
PAGE_PATHS = ["pages"]
ARTICLE_PATHS = ["blog"]
IGNORE_FILES = [".#*", "projects/*"]


DIRECT_TEMPLATES = ["index", "writings", "projects"]
AUTHOR_SAVE_AS = ""
CATEGORY_SAVE_AS = ""
TAG_SAVE_AS = ""
ARCHIVES_SAVE_AS = ""

WRITINGS_SAVE_AS = "writings/index.html"
WRITINGS_URL = "writings/"

PROJECTS_SAVE_AS = "projects/index.html"
PROJECTS_URL = "projects/"

ARTICLE_URL = "writings/{slug}"
ARTICLE_SAVE_AS = "writings/{slug}/index.html"
PAGE_URL = "{slug}"
PAGE_SAVE_AS = "{slug}/index.html"
