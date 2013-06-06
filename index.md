---
layout: default
description: A site to mess around with web development and record my progress through school and beyond
---
<p class="intro">My name is Quinn Rohlf, and I build things with code. This is where I write about web technologies, Portland startups, and anything else that interests me.</p>
{% for post in site.posts %}
    <article class="post">
      <div class="post-content">
      	<h2><a href="{{post.url}}">{{ post.title }}</a></h2>
        <p>{{ post.summary }}</p>
        <div class="post-meta">
        	<p>{{ post.date | date: "%d %h %Y" }}</p>
      	</div>
      </div>
    </article>
{% endfor %}
