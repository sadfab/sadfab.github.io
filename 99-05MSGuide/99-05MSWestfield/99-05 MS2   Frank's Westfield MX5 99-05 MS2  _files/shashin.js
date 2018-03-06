jQuery(document).ready(function($) {
    var shashinAlbumId = shashinGetParameterByName('shashin_album_key');
    var shashinPhotoId = shashinGetParameterByName('shashin_photo_key');

    // thank you - http://stackoverflow.com/questions/4548487/jquery-read-query-string
    function shashinGetParameterByName(name) {
        name = name.replace(/[\[]/,"\\\[").replace(/[\]]/,"\\\]");
        var regexS = "[\\?&]"+name+"=([^&#]*)";
        var regex = new RegExp(regexS);
        var results = regex.exec(window.location.href);
        if (results == null)
            return "";
        else
            return decodeURIComponent(results[1].replace(/\+/g, " "));
    }

    function setShashinFancyBoxCaption(currentArray, currentIndex, currentOpts) {
        var link = currentArray[ currentIndex ];
        var linkId = $(link).attr('id');
        var linkIdParts = linkId.split('_');
        var captionId = '#shashinFancyboxCaption_' + linkIdParts[1]

        if (linkIdParts[2]) {
            captionId = captionId + '_' + linkIdParts[2];
        }

        this.title = $(captionId).html();
        this.title = this.title.replace('<!-- comment for image counter --></div>', '');
        this.title = this.title + 'Image ' + (currentIndex + 1) + ' of ' + currentArray.length + '</div>';
    }

    if (shashinJs.imageDisplayer == 'prettyphoto') {
        // The "-0" and "!!" below are for type casting, as all vars brought over
        // from wp_localize_script come in as strings
        var prettyPhotoSettings = {
            theme: shashinJs.prettyPhotoTheme,
            overlay_gallery: !!(shashinJs.prettyPhotoOverlayGallery-0),
            default_width: shashinJs.prettyPhotoDefaultWidth-0,
            default_height: shashinJs.prettyPhotoDefaultHeight-0,
            show_title: !!(shashinJs.prettyPhotoShowTitle-0),
            autoplay_slideshow: !!(shashinJs.prettyPhotoAutoplaySlideshow-0),
            slideshow: shashinJs.prettyPhotoSlideshow-0
        }

        if (shashinJs.prettyPhotoShowSocialButtons == 0) {
            prettyPhotoSettings['social_tools'] = false;
        }

        $("a[rel^='shashinPrettyPhoto']").shashinPrettyPhoto(prettyPhotoSettings);
    }

    else if (shashinJs.imageDisplayer == 'fancybox') {
        var fancyboxSettings = {
            'showCloseButton': false,
            'titlePosition': 'inside',
            'cyclic': !!(shashinJs.fancyboxCyclic-0),
            'transitionIn': shashinJs.fancyboxTransition,
            'transitionOut': shashinJs.fancyboxTransition,
            'onStart': setShashinFancyBoxCaption
        }

        /* The problem with videos in groups with Fancybox:
         *
         * You can mix videos with images in groups this way:
         * http://groups.google.com/group/fancybox/browse_thread/thread/8c50659a082f9272
         *
         * And you can dynamically set the dimensions of videos this way:
         * http://groups.google.com/group/fancybox/browse_thread/thread/22843096d7870691
         *
         * But the two solutions are not compatible
         *
         * Not setting the width and height at all will do. Fancybox sets a default size,
         * Unfortunately the aspect ratio may be wrong :-(
         */
        var fancyboxVideoSettings = {
            'padding': 0,
            'autoScale': false,
            'href': this.href,
            'type': 'swf',
            'cyclic': !!(shashinJs.fancyboxCyclic-0),
            'width': shashinJs.fancyboxVideoWidth-0,
            'height': shashinJs.fancyboxVideoHeight-0,
            'transitionIn': shashinJs.fancyboxTransition,
            'transitionOut': shashinJs.fancyboxTransition,
            'swf': {
                'wmode': 'transparent',
                'allowfullscreen': 'true'
            }
        }

        var fancyboxInterval = shashinJs.fancyboxInterval - 0;

        if (fancyboxInterval > 0) {
            setInterval($.fancybox.next, fancyboxInterval);
        }

        $(".shashinFancybox").fancybox(fancyboxSettings);
        $(".shashinFancyboxVideo").fancybox(fancyboxVideoSettings);
    }

    $('.shashinTableCell').on('click', '.shashinAlbumThumbLink', function(event) {
        if (shashinJs.imageDisplayer == 'source') {
            return true;
        }

        linkId = '#' + $(this).attr('id');
        // to prevent the photos showing up twice if the user double-clicks
        if ($(linkId).data('clicked')) {
            return false;
        }

        $(linkId).data('clicked', true);

        var parentTable = $(this).parents('.shashinThumbnailsTable');
        var parentTableIdParts = $(parentTable).attr('id').split('_');
        var parentTableStyle = $(parentTable).attr('style');
        var linkIdParts = $(this).attr('id').split('_');

        if (linkIdParts[1] == 'img') {
            var albumTitle = $(this).children('img').attr('alt');
        }

        else if (linkIdParts[1] == 'caption') {
            var albumTitle = $(this).text();
        }

        var dataToSend = {
            action: 'displayAlbumPhotos',
            shashinAlbumId: linkIdParts[2],
            shashinParentTableId: parentTableIdParts[1],
            shashinParentAlbumTitle: albumTitle,
            shashinParentTableStyle: parentTableStyle
        };

        $.get(shashinJs.ajaxUrl, dataToSend, function(dataReceived) {
            shashinScrollTo(parentTable);

            $(parentTable).fadeOut('slow', function() {
                $(parentTable).after($(dataReceived).hide());
                var photosContainer = '#shashinAlbumPhotos_' + linkIdParts[2];
                $(photosContainer).fadeIn('slow');
                shashinAdjustThumbnailDisplay('#' + $(photosContainer).find('.shashinThumbnailsTable').first().attr('id'));

                if (shashinJs.imageDisplayer == 'prettyphoto') {
                    $('#shashinAlbumPhotos_' + linkIdParts[2] + " a[rel^='shashinPrettyPhoto']").shashinPrettyPhoto(prettyPhotoSettings);
                }

                // Fancybox isn't aware of photos not included in the initial page load
                // thank you http://jdmweb.com/resources/FancyBox (see comment reply to @pazul)
                else if (shashinJs.imageDisplayer == 'fancybox') {
                    $('#shashinAlbumPhotos_' + linkIdParts[2] + ' a.shashinFancybox').fancybox(fancyboxSettings);
                    $('#shashinAlbumPhotos_' + linkIdParts[2] + ' a.shashinFancyboxVideo').fancybox(fancyboxVideoSettings);
                }

                // if there was an album id and a photo id in the url, now we can open the
                // photo in the album
                if (shashinAlbumId && shashinPhotoId) {
                    $('a[data-shashinphoto="' + shashinPhotoId + '"]:first').click();
                }
            });
        });

        event.preventDefault();
    });

    var shashinThumbnailDimensions = [];

    function shashinAdjustThumbnailDisplay(element) {
        // If this is a version of IE less than 9, force the captions
        // to "square," make the captions visible, and then bail
        if ((document.documentMode || 100) < 9) {
            $('.shashinThumbnailCaption').css('visibility','visible');
            $('.shashinTableCell').addClass('shashinTableSquare');
            return;
        }

        element = element ? element : '.shashinThumbnailsTable';

        $(element).imagesLoaded().done(function() {
            $(element).each(function() {

                // if the desired sizes for the images in a sample row come to close to
                // the current width of the containing element, remove the row markers
                // (i.e. display the images in a single column), so the images don't
                // shrink too much.
                var idealRowWidth = 0;

                $(this).find('.shashinTableRow:first').find('.shashinTableCell').each(function() {
                    idealRowWidth += parseInt($(this).css('max-width'));
                    idealRowWidth += parseInt($(this).css('margin-left'));
                    idealRowWidth += parseInt($(this).css('margin-right'));
                    idealRowWidth += parseInt($(this).css('padding-left'));
                    idealRowWidth += parseInt($(this).css('padding-right'));
                });

                if ((idealRowWidth * .9) > $(this).parents('.shashinPhotoGroups').parent().width()) {
                    $(this).css('display', 'block');
                    $(this).find('.shashinCaption').css('display', 'block');
                    $(this).find('.shashinTableRowClear:not(:last)').css('clear', 'none');
                    $(this).find('.shashinTableRowClear').css('display', 'inline-block');
                    $(this).find('.shashinTableRow').css('clear', 'none');
                    $(this).find('.shashinTableRow').css('display', 'inline-block');
                    $(this).find('.shashinTableCell').css('width', 'auto');
                    $(this).find('.shashinTableCell').css('display', 'inline-block');
                }

                else if ($(this).css('display') != 'none') {
                    $(this).css('display', 'table');
                    $(this).find('.shashinCaption').css('display', 'table-caption');
                    $(this).find('.shashinTableRowClear').css('clear', 'both');
                    $(this).find('.shashinTableRowClear').css('display', 'table-row');
                    $(this).find('.shashinTableRow').css('clear', 'both');
                    $(this).find('.shashinTableRow').css('display', 'table-row');
                    $(this).find('.shashinTableCell').css('display', 'table-cell');
                    $(this).find('.shashinTableCell').each(function() {
                        $(this).css('width', $(this).data('original_width'));
                    });
                }

                $(this).find('.shashinTableCell').each(function() {
                    // To keep the thumbnail caption from overflowing the thumbnails,
                    // the containing div's max-width is set to the width of the image. But
                    // there are cases where the image width is unknown until after the
                    // page renders, so use the imagesLoaded plugin to set the div's
                    // max-width dynamically. Also, we're going to save the thumbnail
                    // dimensions via ajax, so this problem only happens once per image.
                    if ($(this).css('max-width') == 'none' && typeof $(this).find('.shashinThumbnailImage').prop('naturalWidth') != 'undefined') {
                        $(this).css('max-width', $(this).find('.shashinThumbnailImage').prop('naturalWidth') + 'px');
                        var shashinThumbnailData = $(this).find('.shashinAlbumThumbLink').data();

                        for (var i in shashinThumbnailData) {
                            shashinThumbnailDimensions.push(i); // shashinalbum or shashinphoto
                            shashinThumbnailDimensions.push(shashinThumbnailData[i]); // the album or photo id
                        }

                        shashinThumbnailDimensions.push($(this).find('.shashinThumbnailImage').prop('naturalWidth'));
                        shashinThumbnailDimensions.push($(this).find('.shashinThumbnailImage').prop('naturalHeight'));

                        if (shashinThumbnailDimensions.length > 0) {
                            $.ajax({
                                type: "POST",
                                url: shashinJs.ajaxUrl,
                                data: {
                                    action: 'saveAlbumDimensions',
                                    dimensions: shashinThumbnailDimensions
                                }
                            })
                            shashinThumbnailDimensions = [];
                        }
                    }

                    if (shashinJs.thumbnailDisplay == 'rounded') {
                        var $shashinCaption = $(this).find('.shashinThumbnailCaption');

                        if ($shashinCaption.length > 0) {
                            // center the caption
                            $shashinCaption.width(
                                $(this).find('.shashinThumbnailImage').width()
                                    - parseInt($shashinCaption.css('padding-left'))
                                    - parseInt($shashinCaption.css('padding-right'))
                            );
                            $shashinCaption.css('margin-left', (
                                ($(this).find('.shashinThumbnailImage').width() / 2) * -1) + 'px'
                            );

                            // parsing html when truncating captions is expensive, so do it only
                            // where we need to (on album captions)
                            if ($shashinCaption.find('.shashinAlbumCaptionTitle').length > 0) {
                                $shashinCaption.trunk8({ parseHTML: true });
                            }
                            else {
                                $shashinCaption.trunk8();
                            }

                            // don't display captions if they'll cover more than 45% of the thumbnail
                            // (this means no more than 2 lines of captions)
                            if (($shashinCaption.innerHeight() > ($(this).height() * .45)) || $shashinCaption.text() == '') {
                                $shashinCaption.css('display', 'none');
                            }

                            else {
                                $shashinCaption.css('visibility','visible').hide().fadeIn('slow');
                            }
                        }
                    }

                    else if (shashinJs.thumbnailDisplay == 'square') {
                        // so we get a snug border on portrait-oriented thumbnails
                        // (otherwise the caption may push it wider)
                        $(this).find('.shashinThumbnailWrapper').css('max-width',
                            $(this).find('.shashinThumbnailImage').outerWidth()
                        );

                        $(this).find('.shashinThumbnailCaption').css('visibility','visible').hide().fadeIn('slow');

                    }
                });
            });
        });
    }

    $('.shashinPhotoGroups').on('click', '.shashinNext', function(event) {
        var $parentTable = $(this).closest('.shashinThumbnailsTable');
        var tableIdParts = $parentTable.attr('id').split('_');
        var currentTableId = '#shashinGroup_' + tableIdParts[1] + '_' + tableIdParts[2];
        var nextTableGroupCounter = parseInt(tableIdParts[1]) + 1;
        var nextTableId = '#shashinGroup_' + nextTableGroupCounter + '_' + tableIdParts[2];
        shashinScrollTo($parentTable);
        $(currentTableId).fadeOut('slow', function() {
            $(nextTableId).fadeIn('slow');
            shashinAdjustThumbnailDisplay(nextTableId);
        })

        event.preventDefault();
    });

    $('.shashinPhotoGroups').on('click', '.shashinPrevious', function(event) {
        var $parentTable = $(this).closest('.shashinThumbnailsTable');
        var tableIdParts = $parentTable.attr('id').split('_');
        var currentTableId = '#shashinGroup_' + tableIdParts[1] + '_' + tableIdParts[2];
        var previousTableGroupCounter = parseInt(tableIdParts[1]) - 1;
        var previousTableId = '#shashinGroup_' + previousTableGroupCounter + '_' + tableIdParts[2];
        shashinScrollTo($parentTable);
        $(currentTableId).fadeOut('slow', function() {
            $(previousTableId).fadeIn('slow');
        })

        event.preventDefault();
    });

    function shashinScrollTo(element) {
        $('html, body').animate({
            scrollTop: $(element).offset().top
        }, 1000);
    }

    $('.shashinPhotoGroups').on('click', '.shashinReturn', function(event) {
        $('.shashinAlbumThumbLink').data('clicked', false); // ok to click an album thumbnail again
        var returnLinkIdParts = $(this).attr('id').split('_');
        var parentTableId = '#shashinGroup_' + returnLinkIdParts[1];
        var selectedAlbumPhotosId = '#shashinAlbumPhotos_' + returnLinkIdParts[2];

        $(selectedAlbumPhotosId).fadeOut('slow', function() {
            $(parentTableId).fadeIn('slow');
            shashinScrollTo($(parentTableId));
            $(selectedAlbumPhotosId).remove();
        })

        event.preventDefault();
    });

    function shashinDisableFancyboxForMobile() {
        if (window.innerWidth < 768 && shashinJs.imageDisplayer == 'fancybox') {
            $('.shashinFancybox').unbind('click.fb');
            $('.shashinFancyboxVideo').unbind('click.fb');
        }

    }

    // Keep this near the end of the file so it doesn't interfere with "on"
    // delegation calls above.
    shashinAdjustThumbnailDisplay();
    shashinDisableFancyboxForMobile();

    $(window).smartresize(function() {
        shashinAdjustThumbnailDisplay();
        shashinDisableFancyboxForMobile();
    });

    // automatically open an album if its shashin id is in the URL
    if (shashinAlbumId && !isNaN(shashinAlbumId)) {
        $('a[data-shashinalbum="' + shashinAlbumId + '"]:first').click();
    }

    // automatically load a photo if its shashin id is in the URL
    // (but not if it's in an album - that's already handled in the ajax album loading)
    if (shashinPhotoId && !shashinAlbumId && !isNaN(shashinPhotoId)) {
        $('a[data-shashinphoto="' + shashinPhotoId + '"]:first').click();
    }
});

// smart resize plugin
// http://www.paulirish.com/2009/throttled-smartresize-jquery-event-handler/
if (!jQuery().smartresize) {
    (function($,sr) {
        // debouncing function from John Hann
        // http://unscriptable.com/index.php/2009/03/20/debouncing-javascript-methods/
        var debounce = function (func, threshold, execAsap) {
            var timeout;

            return function debounced () {
                var obj = this, args = arguments;
                function delayed () {
                    if (!execAsap)
                        func.apply(obj, args);
                    timeout = null;
                };

                if (timeout)
                    clearTimeout(timeout);
                else if (execAsap)
                    func.apply(obj, args);

                timeout = setTimeout(delayed, threshold || 100);
            };
        }
        // smartresize
        jQuery.fn[sr] = function(fn){  return fn ? this.bind('resize', debounce(fn)) : this.trigger(sr); };

    })(jQuery,'smartresize');
}

// used by shashinPrettyPhoto
function shashinPopup(url, width, height) {
    var leftPosition = (window.screen.width / 2) - ((width / 2) + 10);
    var topPosition = (window.screen.height / 2) - ((height / 2) + 50);
    window.open(url, "shashinPopup", "status=no,height=" + height + ",width=" + width + ",resizable=yes,left=" + leftPosition + ",top=" + topPosition + ",screenX=" + leftPosition + ",screenY=" + topPosition + ",toolbar=no,menubar=no,scrollbars=no,location=yes,directories=no");
    return false;
}

// used by shashinPrettyPhoto
function shashinLinkPrompt(url) {
    window.prompt ("To share a direct link to this picture, copy this link (ctrl+c, enter)", decodeURIComponent(url));
}
